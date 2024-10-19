<template>
  <div id="app">
    <header>
      <div class="logo-container">
        <a href="https://jws.pictures">
          <img src="https://jws.social/fileserver/01E5SQ87G8HX9T4NYTPR147MJF/attachment/original/01HYRS8T6WMW6VMSHW8MKT2HC0.png" alt="JWS Pictures" />
          <h1>JWS Pictures</h1>
        </a>
      </div>
      <Menubar :model="items" class="menubar" />
    </header>

    <router-view></router-view>

    <footer>
      <p>My photos and shoes are my own. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Menubar from 'primevue/menubar';
import { useHead } from '@vueuse/head'; // Import useHead from @vueuse/head

const router = useRouter();

const items = [
  {
    label: 'All Photos',
    icon: 'pi pi-home',
    command: () => {
      router.push('/');
    },
  },
  {
    label: 'Years',
    icon: 'pi pi-calendar',
    items: [
      { label: '2024', command: () => router.push('/2024') },
      { label: '2023', command: () => router.push('/2023') },
      { label: '2022', command: () => router.push('/2022') },
      // Add more years as needed
    ],
  },
  {
    label: 'About Joe',
    icon: 'pi pi-user',
    url: 'https://jws.dev',
    target: '_blank',
  },
  {
    label: 'Frequently Asked Questions',
    icon: 'pi pi-question-circle',
    command: () => {
      router.push('/faq');
    },
  },
];

// Use useHead to add webmention links to the document head
useHead({
  link: [
    {
      rel: 'webmention',
      href: 'https://webmention.io/jws.pictures/webmention',
    },
    {
      rel: 'pingback',
      href: 'https://webmention.io/jws.pictures/xmlrpc',
    },
  ],
});
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  text-align: center;
}

header .logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

header .logo-container img {
  height: 60px;
  margin-right: 15px;
}

header h1 {
  margin: 0;
  padding: 0;
}

.menubar {
  margin: 0;
  width: 100%;
}

footer {
  text-align: center;
  margin-top: auto;
  padding: 20px 0;
}
</style>
