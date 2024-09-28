<template>
  <div>
    <h1>Photos from {{ year }}</h1>
    <ul v-if="photos.length > 0">
      <li v-for="photo in photos" :key="photo.ID">
        <router-link :to="`/${year}/${photo.ID}`">
          {{ photo.description }} ({{ photo.location }})
        </router-link>
      </li>
    </ul>
    <p v-else-if="!loading && !errorMessage">There aren't any images from {{ year }}.</p>
    <p v-else-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
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
        return response.text();  // Read the response as plain text
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);  // Attempt to parse the text as JSON
          this.photos = data;
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
  }
};
</script>