import { useTranslation } from 'react-i18next';
import { SectionReveal } from './SectionReveal';

export function StorySection() {
  const { t } = useTranslation();

  const steps = [
    { title: t('story.step1'), text: t('story.step1Text') },
    { title: t('story.step2'), text: t('story.step2Text') },
    { title: t('story.step3'), text: t('story.step3Text') },
    { title: t('story.step4'), text: t('story.step4Text') },
  ];

  return (
    <section className="story" id="structure">
      <div className="section-frame">
        <SectionReveal className="story__heading">
          <span className="section-kicker">{t('story.kicker')}</span>
          <h2>{t('story.title')}</h2>
          <p className="story__subtitle">{t('story.subtitle')}</p>
        </SectionReveal>

        <div className="flow-grid flow-grid--compact">
          {steps.map((step, index) => (
            <SectionReveal key={step.title} className="flow-card flow-card--compact" delay={0.05 * index}>
              <span className="flow-card__index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
