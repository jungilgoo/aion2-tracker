import CodeBlock from '../CodeBlock';
import DataTable from '../DataTable';

export default function Section11Integration() {
  return (
    <div className="space-y-4 text-gray-200 leading-relaxed">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">11.1 계산 단계</h4>
        <CodeBlock>
{`Step 1: 개별 스탯 계산 및 수집
  ↓
Step 2: 각 스탯의 전투 점수 기여도 산출
  ↓
Step 3: 모든 기여도를 곱연산으로 통합
  ↓
Step 4: 공격력 적용 및 최종 점수 산출`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">11.2 스탯별 기여도 계산 방식</h4>
        <DataTable
          headers={["스탯", "기여도 계산"]}
          rows={[
            ["전투속도", "전투속도% (그대로)"],
            ["무기 피해 증폭", "무기피해증폭% × 0.66"],
            ["피해 증폭", "PVE피해증폭% + 일반피해증폭% (합산)"],
            ["치명타 피해 증폭", "확률 기반 기댓값 (섹션 7.3, 별도 곱연산)"],
            ["스킬", "총스킬점수% (그대로)"],
            ["쿨타임 감소", "이론적증가% × 0.7"],
            ["강타", "강타% (그대로)"],
            ["완벽", "완벽% × 무기min/max비율"],
            ["다단히트", "기본18% 제외한 증가분"],
          ]}
        />
        <p className="mt-2 text-sm text-yellow-300">
          <strong>중요:</strong> 치명타 피해 증폭은 다른 피해 증폭들과 달리 단순 합산되지 않고,
          치명타 확률에 따른 기댓값으로 별도 계산되어 곱연산에 참여합니다.
        </p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">11.3 최종 통합 공식</h4>
        <CodeBlock>
{`// 모든 기여도를 곱연산
totalMultiplier = 1.0
  × (1 + 전투속도기여도/100)
  × (1 + 무기피해증폭기여도/100)
  × (1 + 피해증폭기여도/100)
  × (1 + 치명타피해증폭기여도/100)
  × (1 + 스킬기여도/100)
  × (1 + 쿨타임기여도/100)
  × (1 + 강타기여도/100)
  × (1 + 완벽기여도/100)
  × (1 + 다단히트기여도/100)

최종_전투_점수 = 공격력 × totalMultiplier`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">11.4 기본 DPS vs 전투 점수</h4>
        <p className="mb-2"><strong>기본 DPS (참고용):</strong></p>
        <CodeBlock>
{`baseDPS = 공격력 × (1+피해증폭) × (1+스킬) × 전투속도계수 × 쿨타임계수
finalDPS = baseDPS × (1+완벽계수) × (1+강타계수) × (1+다단히트계수)`}
        </CodeBlock>

        <p className="mt-4 mb-2"><strong>전투 점수 (실제 표시):</strong></p>
        <CodeBlock>
{`각 스탯의 기여도를 개별 계산 → 곱연산 통합 → 최종 점수`}
        </CodeBlock>
      </div>
    </div>
  );
}
