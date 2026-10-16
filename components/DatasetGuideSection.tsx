import { COMMON_READING_STEPS, DATASET_GUIDES } from "../lib/dataset-guide";
import type { NationalNutritionDatasetSlug } from "../lib/national-nutrition-api";

export function DatasetGuideSection({ dataset, shortName }: { dataset: NationalNutritionDatasetSlug; shortName: string }) {
  const guide = DATASET_GUIDES[dataset];
  return (
    <section className="dataset-guide" aria-labelledby="dataset-guide-title">
      <h2 id="dataset-guide-title">{shortName} 자료 읽는 법</h2>
      <p>{guide.scope}</p>
      <h3>값을 읽기 전에 확인할 것</h3>
      <ol>
        {COMMON_READING_STEPS.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <h3>{shortName} 자료에서 특히 주의할 점</h3>
      <ul>
        {guide.cautions.map((caution) => <li key={caution}>{caution}</li>)}
      </ul>
      <p>{guide.nextStep}</p>
    </section>
  );
}
