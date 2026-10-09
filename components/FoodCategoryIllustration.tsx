import React from "react";

type IllustrationProps = {
  category?: string;
  foodName?: string;
  className?: string;
  width?: number;
  height?: number;
};

export function FoodCategoryIllustration({
  category = "",
  foodName = "",
  className = "",
  width = 64,
  height = 64,
}: IllustrationProps) {
  const cat = `${category} ${foodName}`.toLowerCase();

  // 카테고리별 테마 및 아이콘 매핑
  if (cat.includes("샐러드") || cat.includes("채소") || cat.includes("김치") || cat.includes("나물")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#E8F5E9" />
        {/* 보울 */}
        <path d="M14 34C14 43.941 22.059 52 32 52C41.941 52 50 43.941 50 34H14Z" fill="#81C784" />
        {/* 채소 잎 */}
        <path d="M22 28C22 20 30 18 32 26C34 18 42 20 42 28C42 34 32 36 32 36C32 36 22 34 22 28Z" fill="#4CAF50" />
        <path d="M26 24C28 20 36 21 37 25" stroke="#C8E6C9" strokeWidth="2" strokeLinecap="round" />
        {/* 방울토마토 포인트 */}
        <circle cx="38" cy="30" r="4" fill="#EF5350" />
      </svg>
    );
  }

  if (cat.includes("샌드위치") || cat.includes("버거") || cat.includes("토스트")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#FFF3E0" />
        {/* 빵 상단 */}
        <path d="M14 26C14 20 22 16 32 16C42 16 50 20 50 26H14Z" fill="#FFA726" />
        {/* 패티 및 치즈 토핑 */}
        <path d="M16 28L48 28" stroke="#66BB6A" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 33L46 33" stroke="#FFCA28" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 38L49 38" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round" />
        {/* 빵 하단 */}
        <path d="M14 42H50C50 46 44 48 32 48C20 48 14 46 14 42Z" fill="#FFA726" />
      </svg>
    );
  }

  if (cat.includes("닭") || cat.includes("치킨") || cat.includes("고기") || cat.includes("육류") || cat.includes("소시지") || cat.includes("햄")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#FBE9E7" />
        {/* 닭다리/단백질 */}
        <path d="M22 22C16 28 17 38 25 44C30 48 38 46 42 41C46 36 45 27 38 22C33 18 26 18 22 22Z" fill="#FF7043" />
        <circle cx="28" cy="28" r="5" fill="#FFA726" opacity="0.6" />
        {/* 뼈 부분 */}
        <path d="M40 40L47 47" stroke="#ECEFF1" strokeWidth="5" strokeLinecap="round" />
        <circle cx="48" cy="46" r="3" fill="#ECEFF1" />
        <circle cx="46" cy="48" r="3" fill="#ECEFF1" />
      </svg>
    );
  }

  if (cat.includes("면") || cat.includes("라면") || cat.includes("국수") || cat.includes("우동") || cat.includes("파스타")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#FFFDE7" />
        {/* 그릇 */}
        <path d="M14 32C14 43 22 50 32 50C42 50 50 43 50 32H14Z" fill="#FFD54F" />
        {/* 면발 곡선 */}
        <path d="M20 28C22 20 26 22 28 28C30 22 34 22 36 28C38 20 42 22 44 28" stroke="#FFA000" strokeWidth="3" strokeLinecap="round" />
        {/* 젓가락 */}
        <path d="M18 16L48 24" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 20L48 25" stroke="#8D6E63" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (cat.includes("밥") || cat.includes("죽") || cat.includes("도시락") || cat.includes("햇반")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#F5F5F5" />
        {/* 공깃밥 그릇 */}
        <path d="M16 34C16 43 23 50 32 50C41 50 48 43 48 34H16Z" fill="#90A4AE" />
        {/* 소복한 밥 */}
        <path d="M18 34C18 24 24 18 32 18C40 18 46 24 46 34H18Z" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="2" />
        <circle cx="28" cy="26" r="1.5" fill="#CFD8DC" />
        <circle cx="34" cy="24" r="1.5" fill="#CFD8DC" />
        <circle cx="37" cy="28" r="1.5" fill="#CFD8DC" />
      </svg>
    );
  }

  if (cat.includes("음료") || cat.includes("주스") || cat.includes("차") || cat.includes("커피") || cat.includes("우유")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#E0F7FA" />
        {/* 컵 */}
        <path d="M22 22L25 48C25 49 26 50 27 50H37C38 50 39 49 39 48L42 22H22Z" fill="#4DD0E1" />
        {/* 컵 뚜껑 / 빨대 */}
        <path d="M20 22H44" stroke="#0097A7" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 14L30 24" stroke="#FF7043" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (cat.includes("생선") || cat.includes("고등어") || cat.includes("연어") || cat.includes("수산물") || cat.includes("어묵")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#E1F5FE" />
        {/* 물고기 */}
        <path d="M16 32C24 22 40 24 48 32C40 40 24 42 16 32Z" fill="#4FC3F7" />
        <path d="M48 32L54 26V38L48 32Z" fill="#0288D1" />
        <circle cx="24" cy="30" r="2" fill="#FFFFFF" />
      </svg>
    );
  }

  if (cat.includes("과자") || cat.includes("스낵") || cat.includes("쿠키") || cat.includes("떡") || cat.includes("디저트") || cat.includes("케이크")) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#FCE4EC" />
        {/* 쿠키/스낵 */}
        <circle cx="32" cy="32" r="16" fill="#F48FB1" />
        <circle cx="26" cy="28" r="2.5" fill="#AD1457" />
        <circle cx="36" cy="26" r="2" fill="#AD1457" />
        <circle cx="31" cy="36" r="2.5" fill="#AD1457" />
        <circle cx="38" cy="35" r="1.5" fill="#AD1457" />
      </svg>
    );
  }

  // 기본 영양/식품 아이콘
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#E8F0FE" />
      {/* 클립보드 / 리포트 / 식품 밸런스 */}
      <rect x="20" y="16" width="24" height="32" rx="4" fill="#66BB6A" />
      <path d="M26 24H38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 30H38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 36H34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="15" r="3" fill="#43A047" />
    </svg>
  );
}
