<template>
  <div class="faq-page">
    <h1>Frequently Asked Questions</h1>

    <Accordion multiple>
      <AccordionTab
        v-for="(faq, index) in faqs"
        :key="index"
        :header="faq.question"
      >
        <p>{{ faq.answer }}</p>
      </AccordionTab>
    </Accordion>
  </div>
</template>

<script>
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';

export default {
  name: 'FAQ',
  components: {
    Accordion,
    AccordionTab,
  },
  data() {
    return {
      faqs: [
        {
          question: 'Can I reuse your images in my project?',
          answer:
            'All images and their details are the property of Joe Steinbring and are protected by copyright law. Unauthorized use, reproduction, or distribution of these images is prohibited. If you wish to use any of the images, please contact Joe Steinbring for permission.',
        },
        {
          question: 'Can I use your images to train my AI?',
          answer:
            'No.',
        },
        {
          question: 'How can I contact you?',
          answer:
            'You can find my contact information at https://jws.dev/contact.html',
        },
      ],
    };
  },
};
</script>

<style scoped>
.faq-page {
  max-width: 80%;
  margin: 0 auto;
  padding: 1rem;
}

.faq-page h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.p-accordion .p-accordion-header {
  font-weight: bold;
}

.p-accordion .p-accordion-content {
  padding: 1rem;
}

.p-accordion .p-accordion-header-link {
  text-decoration: none;
  color: inherit;
}

.p-accordion .p-accordion-header-link:hover {
  text-decoration: underline;
}
</style>
