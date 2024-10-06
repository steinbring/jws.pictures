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
import Breadcrumb from 'primevue/breadcrumb';

export default {
  components: {
    Image,
    Card,
    Breadcrumb,
  },
  props: ['year'],
  data() {
    return {
      photos: [],
      loading: true,
      errorMessage: null,
      home: { icon: 'pi pi-home', to: '/' },
      items: [],
    };
  },
  mounted() {
    // Set up breadcrumb items using the command property
    this.items = [
      {
        label: 'Years',
        command: () => {
          this.$router.push('/years');
        },
      },
      {
        label: `Photos from ${this.year}`,
        command: () => {
          this.$router.push(`/${this.year}`);
        },
      },
    ];

    // Fetch photos for the specified year
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
            // Sort from newest to oldest
            .sort((a, b) => new Date(b.date) - new Date(a.date));
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
