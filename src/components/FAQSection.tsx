import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

export function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq" id="faq">
      <div className="section-frame">
        <span className="section-kicker">{t('faq.kicker')}</span>
        <h2 className="section-heading">{t('faq.title')}</h2>
        
        <div className="faq__list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq__item ${openIndex === index ? 'faq__item--open' : ''}`}
            >
              <button
                className="faq__question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq__icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="faq__answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
