<template>
  <div>
    <!-- Breadcrumb Component -->
    <Breadcrumb :home="home" :model="items" class="breadcrumb" />

    <div v-if="photos.length > 0" class="card-container">
      <div
        v-for="photo in photos"
        :key="photo.ID"
        class="card-wrapper"
        v-scrollanimation
      >
        <Card>
          <template #header>
            <router-link :to="`/${photo.year}/${photo.ID}`">
              <Image
                :src="photo.smallImage"
                :alt="`Photo taken at ${photo.location} on ${formatDate(photo.date)}`"
                :preview="false"
                loading="lazy"
              />
            </router-link>
          </template>
          <template #title>
            <router-link :to="`/${photo.year}/${photo.ID}`" class="card-title">
              {{ photo.location }}
            </router-link>
          </template>
          <template #subtitle>
            {{ formatDate(photo.date) }}
          </template>
        </Card>
      </div>
    </div>

    <p v-else>
      There are no photos available.
    </p>
  </div>
</template>

<script>
import Image from 'primevue/image';
import Card from 'primevue/card';
import Breadcrumb from 'primevue/breadcrumb';

export default {
  components: {
    Image,
    Card,
    Breadcrumb,
  },
  data() {
    return {
      photos: [],
      home: { icon: 'pi pi-home', to: '/' },
      items: [{ label: 'All Photos' }],
    };
  },
  mounted() {
    fetch('/photos/all.json')
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
              const year = new Date(date).getFullYear();
              return {
                ...photo,
                smallImage,
                date,
                year,
              };
            })
            // Sort from newest to oldest
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
          throw new Error('Invalid JSON format');
        }
      })
      .catch((error) => {
        console.error('Error fetching photos:', error.message);
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

  .breadcrumb {
    margin-bottom: 2rem;
  }

  .card-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .card-wrapper {
    width: 400px; /* Set a fixed width for all cards */
    overflow: hidden; /* Prevent content overflow */
    box-sizing: border-box; /* Include padding and border in width */
  }

  .p-card {
    width: 100%;
  }

  .p-card img {
    display: block;
    width: 100%;
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
