import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section02Attack() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">2.1 기본 공식</h4>
        <CodeBlock>
{`// 1단계: 베이스 공격력 (정수)
baseAttack = 데바니온 + 장비/장신구 + 돌파정수

// 2단계: 퍼센트 배율
percentMultiplier = 돌파% + 파괴% + 위력%

// 3단계: 최종 공격력
finalAttack = Math.floor(baseAttack × (1 + percentMultiplier/100)) + 아리엘PVE`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">2.2 수집 출처</h4>
        <DataTable
          headers={["출처", "타입", "설명"]}
          rows={[
            ["데바니온 (4개 보드)", "정수", "네자칸, 루미엘, 시엘, 트리니엘"],
            ["장비/장신구 기본", "정수", "baseAttack + enhanceBonus"],
            ["돌파 정수", "정수", "돌파 레벨 × 30"],
            ["아리엘 PVE", "정수", "PVE/보스 공격력 (별도 추가)"],
            ["돌파 퍼센트", "퍼센트", "돌파 레벨 × 1%"],
            ["파괴 스탯", "퍼센트", "파괴 스탯 × 0.2%"],
            ["위력 스탯", "퍼센트", "위력 스탯 × 0.1%"],
          ]}
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">2.3 공격력 % 캡 시스템</h4>
        <CodeBlock>
{`CAP_LIMIT = 100%

// 캡 계산에 포함
총 캡% = 돌파% + 파괴% + 위력% + 패시브스킬%

// 캡 초과 시 적용
if (총캡% > 100%) {
  cappedAttack = finalAttack × (1 + 100/100) / (1 + 총캡%/100)
}`}
        </CodeBlock>
        <p className="mt-2 text-sm text-gray-400">
          <strong>직업별 패시브 스킬:</strong><br />
          - 살성/검성/호법성: 레벨당 +1%<br />
          - 궁성/마도성: 레벨당 +1.5%<br />
          - 정령성: 레벨당 +1%
        </p>
      </div>
    </div>
  );
}
