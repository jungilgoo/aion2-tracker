import AccordionSection from './AccordionSection';
import Section01Overview from './sections/Section01Overview';
import Section02Attack from './sections/Section02Attack';
import Section03DamageAmp from './sections/Section03DamageAmp';
import Section04Skill from './sections/Section04Skill';
import Section05Speed from './sections/Section05Speed';
import Section06Cooldown from './sections/Section06Cooldown';
import Section07Critical from './sections/Section07Critical';
import Section08Strike from './sections/Section08Strike';
import Section09Perfect from './sections/Section09Perfect';
import Section10MultiHit from './sections/Section10MultiHit';
import Section11Integration from './sections/Section11Integration';
import Section12Summary from './sections/Section12Summary';

export default function HelpContent() {
  return (
    <div className="space-y-4 text-base leading-relaxed">
      <AccordionSection title="1. 전투 점수 개요" defaultOpen>
        <Section01Overview />
      </AccordionSection>

      <AccordionSection title="2. 공격력 계산">
        <Section02Attack />
      </AccordionSection>

      <AccordionSection title="3. 피해 증폭 계산">
        <Section03DamageAmp />
      </AccordionSection>

      <AccordionSection title="4. 스킬 점수 계산">
        <Section04Skill />
      </AccordionSection>

      <AccordionSection title="5. 전투 속도 계산">
        <Section05Speed />
      </AccordionSection>

      <AccordionSection title="6. 재사용 대기 시간 감소 계산">
        <Section06Cooldown />
      </AccordionSection>

      <AccordionSection title="7. 치명타 계산">
        <Section07Critical />
      </AccordionSection>

      <AccordionSection title="8. 강타 계산">
        <Section08Strike />
      </AccordionSection>

      <AccordionSection title="9. 완벽 계산">
        <Section09Perfect />
      </AccordionSection>

      <AccordionSection title="10. 다단 히트 적중 계산">
        <Section10MultiHit />
      </AccordionSection>

      <AccordionSection title="11. 최종 전투 점수 통합">
        <Section11Integration />
      </AccordionSection>

      <AccordionSection title="12. 핵심 요약">
        <Section12Summary />
      </AccordionSection>
    </div>
  );
}
