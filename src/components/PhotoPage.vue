<template>
  <div>
    <h1>{{ photo.description }}</h1>
    <p>Location: {{ photo.location }}</p>
    <p>Date: {{ new Date(photo.exif.DateTime).toLocaleDateString() }}</p>
    <img :src="photo.filenames.filename[0]" alt="Photo" />
  </div>
</template>

<script>
export default {
  props: ['year', 'id'],
  data() {
    return {
      photo: null
    };
  },
  mounted() {
    fetch(`/photos/${this.year}/${this.id}.json`)
      .then((response) => response.json())
      .then((data) => {
        this.photo = data;
      });
  }
};
</script>