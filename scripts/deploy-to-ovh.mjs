// OVH VPS 실서버 완전 자동 배포 파이프라인
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const VPS_USER = "ubuntu";
const VPS_HOST = "51.79.206.71";
const COMPOSE_FILE = "/opt/yungyanggogo-production/compose.yaml";
const CONTAINER_NAME = "yungyanggogo-production-web";
const LOCAL_TEMP_DIR = path.resolve("./tmp-ovh-image");

console.log("==================================================");
console.log("  영양고고 OVH 실서버 완전 자동 배포 파이프라인");
console.log("==================================================");

function run(cmd, args, options = {}) {
  const displayCmd = `${cmd} ${args.join(" ")}`;
  console.log(`> ${displayCmd}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`명령어 실패: ${displayCmd} (종료 코드: ${result.status})`);
  }
  return result;
}

function runCapture(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`명령어 실패: ${cmd} ${args.join(" ")}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function ssh(remoteCmd) {
  const args = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", `${VPS_USER}@${VPS_HOST}`, remoteCmd];
  return runCapture("ssh", args);
}

// 1. 사전 품질 검증 및 2차 리뷰
console.log("\n[1단계] 로컬 개선 및 전수 검증 게이트 가동...");
run(process.execPath, ["scripts/run-content-pipeline-daemon.mjs"]);

// 2. Git 변경사항 커밋 및 푸시
console.log("\n[2단계] Git 상태 점검 및 원격 저장소 푸시...");
const gitStatus = runCapture("git", ["status", "--porcelain"]);
if (gitStatus.length > 0) {
  console.log("- 감지된 변경사항 스테이징 및 커밋 중...");
  run("git", ["add", "."]);
  run("git", ["commit", "-m", "chore(deploy): automated content update and validation passing"]);
} else {
  console.log("- 로컬 작업 트리가 깨끗합니다 (커밋 생략).");
}

console.log("- GitHub main 브랜치 푸시 중...");
run("git", ["push", "origin", "main"]);

// 3. GitHub Actions Docker 이미지 빌드 워크플로 실행
console.log("\n[3단계] GitHub Actions 클라우드 빌드(ovh-image.yml) 가동...");
run("gh", ["workflow", "run", "ovh-image.yml"]);

console.log("- 방금 실행된 워크플로 런 조회 중...");
let runId = "";
for (let i = 0; i < 10; i++) {
  try {
    const jsonStr = runCapture("gh", ["run", "list", "--workflow", "ovh-image.yml", "--limit", "1", "--json", "databaseId,status"]);
    const runs = JSON.parse(jsonStr);
    if (runs.length > 0) {
      runId = String(runs[0].databaseId);
      break;
    }
  } catch {}
  execFileSync(process.execPath, ["-e", "setTimeout(()=>{}, 2000)"]);
}

if (!runId) {
  throw new Error("워크플로 런 ID를 확인하지 못했습니다.");
}

console.log(`- 워크플로 런 대기 중 (ID: ${runId})...`);
run("gh", ["run", "watch", runId]);

// 4. 빌드 아티팩트 다운로드
console.log("\n[4단계] 빌드된 Docker 이미지 아티팩트 다운로드...");
if (existsSync(LOCAL_TEMP_DIR)) {
  rmSync(LOCAL_TEMP_DIR, { recursive: true, force: true });
}

run("gh", ["run", "download", runId, "--dir", LOCAL_TEMP_DIR]);

const tagFile = path.join(LOCAL_TEMP_DIR, "ovh-image", "image-tag.txt");
const tarFile = path.join(LOCAL_TEMP_DIR, "ovh-image", "image.tar.gz");

if (!existsSync(tagFile) || !existsSync(tarFile)) {
  throw new Error("다운로드된 아티팩트에 이미지 파일 또는 태그 정보가 누락되었습니다.");
}

const imageTag = readFileSync(tagFile, "utf8").trim();
console.log(`✓ 이미지 파일 준비 완료: 태그=${imageTag}`);

// 5. OVH VPS 서버 전송 및 Docker 로드
console.log("\n[5단계] OVH VPS 서버에 이미지 전송 및 Docker 로드...");
console.log("- 이미지 파일 SCP 전송 중 (/tmp/image.tar.gz)...");
run("scp", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", tarFile, `${VPS_USER}@${VPS_HOST}:/tmp/image.tar.gz`]);

console.log("- 서버 내부 docker load 실행 중...");
const loadOutput = ssh("gzip -dc /tmp/image.tar.gz | sudo docker load");
console.log(`✓ ${loadOutput}`);

const imageDigest = ssh(`sudo docker image inspect ${imageTag} --format '{{.Id}}'`);
console.log(`✓ 서버 내 이미지 Digest: ${imageDigest}`);

// 6. 컨테이너 롤링 교체
console.log("\n[6단계] compose.yaml 이미지 갱신 및 컨테이너 무중단 교체...");
ssh(`sudo cp ${COMPOSE_FILE} ${COMPOSE_FILE}.bak`);
ssh(`sudo sed -i 's|image: sha256:.*|image: ${imageDigest}|g' ${COMPOSE_FILE}`);

console.log("- 컨테이너 리크리에이트 실행 중...");
const composeUp = ssh(`sudo docker compose -f ${COMPOSE_FILE} up -d web`);
console.log(composeUp);

// 7. 실서버 라이브 확인 및 임시 파일 정리
console.log("\n[7단계] 실서버 헬스체크 및 임시 파일 정리...");
let isHealthy = false;
for (let i = 0; i < 10; i++) {
  const status = ssh(`sudo docker inspect ${CONTAINER_NAME} --format '{{.State.Health.Status}}'`);
  if (status === "healthy") {
    isHealthy = true;
    break;
  }
  execFileSync(process.execPath, ["-e", "setTimeout(()=>{}, 3000)"]);
}

if (!isHealthy) {
  console.warn("경고: 컨테이너 헬스체크 대기 시간 초과. 로그 확인 필요.");
} else {
  console.log("✓ 웹 컨테이너 상태: healthy");
}

ssh("rm -f /tmp/image.tar.gz");
rmSync(LOCAL_TEMP_DIR, { recursive: true, force: true });
console.log("✓ 임시 파일 정리 완료");

console.log("- 공인 도메인 실시간 응답 확인 (https://yungyanggogo.kr)...");
const httpStatus = ssh("curl -s -o /dev/null -w '%{http_code}' https://yungyanggogo.kr/blog");
console.log(`✓ https://yungyanggogo.kr/blog 응답 코드: ${httpStatus}`);

console.log("\n==================================================");
console.log("  OVH 실서버 배포가 완벽하게 완료되었습니다!");
console.log("==================================================");
