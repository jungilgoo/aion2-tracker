import CodeBlock from '../CodeBlock';

export default function Section10MultiHit() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">10.1 수집 출처</h4>
        <p>영혼 각인, 마석 각인, 데바니온에서 수집</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">10.2 4차 다항식 공식</h4>
        <CodeBlock>
{`x = 다단히트확률% / 100
y = 11.1×x + 13.9×x² + 17.8×x³ + 23.9×x⁴

다단히트계수 = y / 100`}
        </CodeBlock>
        <p className="mt-2 text-sm text-gray-400">
          <strong>각 항의 의미:</strong><br />
          - 1차항 (11.1x): 1타 발동 (+11% 피해)<br />
          - 2차항 (13.9x²): 2타 발동 (+25% 피해)<br />
          - 3차항 (17.8x³): 3타 발동 (+43% 피해)<br />
          - 4차항 (23.9x⁴): 4타 발동 (+67% 피해)
        </p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">10.3 전투 점수 기여도</h4>
        <CodeBlock>
{`// 기본 다단히트 18% 고려
baseMultiHit = 18%
totalMultiHit = 18% + 스탯다단히트%

xBase = 0.18
baseDamage = 11.1×xBase + 13.9×xBase² + 17.8×xBase³ + 23.9×xBase⁴

xTotal = totalMultiHit / 100
totalDamage = 11.1×xTotal + 13.9×xTotal² + 17.8×xTotal³ + 23.9×xTotal⁴

기여도 = ((1 + totalDamage/100) / (1 + baseDamage/100) - 1) × 100`}
        </CodeBlock>
      </div>
    </div>
  );
}
