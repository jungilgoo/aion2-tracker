import CodeBlock from '../CodeBlock';

export default function Section01Overview() {
  return (
    <div className="space-y-4 text-gray-300">
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">1.1 핵심 공식</h4>
        <CodeBlock>
{`최종 전투 점수 = 공격력 × 모든_스탯_기여도의_곱`}
        </CodeBlock>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-2">1.2 계산 흐름</h4>
        <CodeBlock>
{`개별 스탯 계산 → 기여도 산출 → 곱연산 통합 → 최종 점수`}
        </CodeBlock>
      </div>
    </div>
  );
}
