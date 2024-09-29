<template>
  <div>
    <h1>Photos from {{ year }}</h1>

    <div v-if="photos.length > 0" class="card-container">
      <div
        v-for="photo in photos"
        :key="photo.ID"
        class="card-wrapper"
        v-scrollanimation
      >
        <Card>
          <template #header>
            <router-link :to="`/${year}/${photo.ID}`">
              <Image
                :src="photo.smallImage"
                :alt="`Photo taken at ${photo.location} on ${formatDate(photo.date)}`"
                :preview="false"
                loading="lazy"
              />
            </router-link>
          </template>
          <template #title>
            <router-link :to="`/${year}/${photo.ID}`" class="card-title">
              {{ photo.location }}
            </router-link>
          </template>
          <template #subtitle>
            {{ formatDate(photo.date) }}
          </template>
        </Card>
      </div>
    </div>

    <p v-else-if="!loading && !errorMessage">
      There aren't any images from {{ year }}.
    </p>
    <p v-else-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script>
import Image from 'primevue/image';
import Card from 'primevue/card';

export default {
  components: {
    Image,
    Card,
  },
  props: ['year'],
  data() {
    return {
      photos: [],
      loading: true,
      errorMessage: null,
    };
  },
  mounted() {
    fetch(`/photos/${this.year}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('File not found');
        }
        return response.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          this.photos = data
            .map((photo) => {
              const smallImage = photo.filenames.filename.find((filename) =>
                filename.endsWith('-small.jpeg')
              );
              const date = photo.exif.DateTime;
              return {
                ...photo,
                smallImage,
                date,
              };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      })
      .catch((error) => {
        if (error.message === 'File not found') {
          this.errorMessage = `Error: Photos from ${this.year} not found.`;
        } else if (error.message === 'Invalid JSON format') {
          this.errorMessage = `Error: The data for ${this.year} contains invalid JSON.`;
        } else {
          this.errorMessage = `Error: Unable to load photos from ${this.year}.`;
        }
      })
      .finally(() => {
        this.loading = false;
      });
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
  },
  directives: {
    scrollanimation: {
      mounted(el) {
        function animateOnScroll() {
          if (isInViewport(el)) {
            el.classList.add('animate__animated', 'animate__fadeIn');
            window.removeEventListener('scroll', animateOnScroll);
          }
        }
        function isInViewport(element) {
          const rect = element.getBoundingClientRect();
          return (
            rect.top <=
            (window.innerHeight || document.documentElement.clientHeight)
          );
        }
        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll();
      },
    },
  },
};
</script>

<style scoped>
@import 'animate.css/animate.min.css';

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; /* Center the cards horizontally */
  align-items: flex-start; /* Align cards to the top */
  gap: 1rem; /* Space between cards */
}

.card-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.p-card {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center content inside the card */
}

.p-card img {
  max-width: 100%;
  height: auto;
}

.card-title {
  text-decoration: none;
  color: inherit;
}

.card-title:hover {
  text-decoration: underline;
}

.p-card .p-card-title,
.p-card .p-card-subtitle {
  text-align: center;
  margin: 0.5rem 0;
}

.router-link {
  display: block;
}
</style>
