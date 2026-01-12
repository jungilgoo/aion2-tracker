import CodeBlock from '../CodeBlock';

export default function Section04Skill() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">4.1 3가지 카테고리</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>액티브 스킬</strong> (12개)</li>
          <li><strong>패시브 스킬</strong> (10개)</li>
          <li><strong>스티그마</strong> (레벨 높은 상위 4개)</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">4.2 스킬 점수 공식</h4>
        <CodeBlock>
{`// 개별 스킬 점수
스킬점수 = (기본점수 + 보너스점수) × 중요도계수

// 기본 점수
기본점수 = 스킬레벨 × 1.5

// 보너스 점수 (마일스톤)
액티브: Lv8(+5), Lv12(+10), Lv16(+15), Lv20(+10)
패시브: 없음
스티그마: Lv5(+5), Lv10(+10), Lv15(+25), Lv20(+40)`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">4.3 중요도 계수</h4>
        <p className="mb-2"><strong>스티그마:</strong></p>
        <CodeBlock>
{`중요도계수 = (해당스킬_평균레벨 / 최고스킬_평균레벨) × 1.5
최소값 = 0.2 (20%)`}
        </CodeBlock>

        <p className="mt-4 mb-2"><strong>액티브/패시브:</strong></p>
        <CodeBlock>
{`step = (200% - 20%) / (총스킬수 - 1)

1순위: 200%
2순위: 200% - step
3순위: 200% - step × 2
...
마지막순위: 20%`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">4.4 카테고리별 평균</h4>
        <CodeBlock>
{`액티브점수 = (모든_액티브_스킬점수_합) / 12
패시브점수 = (모든_패시브_스킬점수_합) / 10
스티그마점수 = (상위4개_스킬점수_합) / 4

총_스킬점수 = 액티브점수 + 패시브점수 + 스티그마점수`}
        </CodeBlock>
      </div>
    </div>
  );
}
