import CodeBlock from '../CodeBlock';

export default function Section12Summary() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">12.1 계산 원리</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>독립적 계산</strong>: 각 스탯이 독립적으로 계산됨</li>
          <li><strong>곱연산 통합</strong>: 모든 기여도가 곱연산으로 시너지 발생</li>
          <li><strong>공격력 기준</strong>: 최종적으로 공격력에 곱함</li>
          <li><strong>캡 시스템</strong>: 공격력 % 캡으로 밸런스 조정</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">12.2 중요 공식</h4>
        <CodeBlock>
{`// 공격력
finalAttack = Math.floor(baseAttack × (1 + percent%/100)) + 아리엘PVE

// 전투속도/쿨감
계수 = 1 / (1 - 퍼센트%)

// 치명타 확률
확률% = (정수 × 0.7) / 10

// 다단히트
y = 11.1x + 13.9x² + 17.8x³ + 23.9x⁴

// 최종
전투점수 = 공격력 × Π(1 + 기여도/100)`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">12.3 설계 특징</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>비선형 증가</strong>: 전투속도, 쿨타임, 다단히트</li>
          <li><strong>선형 합산</strong>: 피해 증폭 (4종 합산)</li>
          <li><strong>확률 기반</strong>: 완벽, 강타, 치명타</li>
          <li><strong>상대적 효율</strong>: 각 스탯마다 계수 다름 (무기피해증폭 ×0.66, 쿨타임 ×0.7 등)</li>
        </ul>
      </div>
    </div>
  );
}
