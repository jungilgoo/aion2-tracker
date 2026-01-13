import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section06Cooldown() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">6.1 수집 출처</h4>
        <DataTable
          headers={["출처", "계산 방식"]}
          rows={[
            ["타이틀", "직접 합산"],
            ["환상 스탯", "환상 × 0.2%"],
            ["데바니온", "직접 합산"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">6.2 DPS 계수 공식</h4>
        <CodeBlock>
{`쿨타임감소계수 = 1 / (1 - 쿨타임감소%)

// 안전 장치
if (쿨타임감소 >= 100% || 쿨타임감소 <= 0%) {
  쿨타임감소계수 = 1
}`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">6.3 전투 점수 기여도</h4>
        <CodeBlock>
{`COOLDOWN_EFFICIENCY = 0.7 // 효율 계수

이론적증가 = ((1 / (1 - 쿨타임감소%)) - 1) × 100
실제기여도 = 이론적증가 × 0.7`}
        </CodeBlock>
      </div>
    </div>
  );
}
