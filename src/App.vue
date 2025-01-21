<template>
  <div id="app">
    <header>
      <div class="logo-container">
        <a href="https://jws.pictures">
          <img
            :src="logoUrl"
            alt="JWS Pictures"
          />
        </a>
      </div>
      <!-- PrimeVue Menubar -->
      <Menubar :model="items" class="menubar" />
    </header>

    <!-- Route outlet -->
    <router-view />

    <footer>
      <p>My photos and shoes are my own. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import { useHead } from '@vueuse/head'

// Import the SVG from src/assets
import logoUrl from './jws-pictures-logo-light.svg'

// reate your menubar items
const router = useRouter()
const items = [
  {
    label: 'All Photos',
    icon: 'pi pi-home',
    command: () => router.push('/')
  },
  {
    label: 'Years',
    icon: 'pi pi-calendar',
    items: [
      { label: '2025', command: () => router.push('/2025') },
      { label: '2024', command: () => router.push('/2024') },
      { label: '2023', command: () => router.push('/2023') },
      { label: '2022', command: () => router.push('/2022') },
      { label: '2021', command: () => router.push('/2021') },
      { label: '2020', command: () => router.push('/2020') },
      { label: '2019', command: () => router.push('/2019') },
      { label: '2018', command: () => router.push('/2018') }
    ]
  },
  {
    label: 'About Joe',
    icon: 'pi pi-user',
    url: 'https://jws.dev',
    target: '_blank'
  },
  {
    label: 'Frequently Asked Questions',
    icon: 'pi pi-question-circle',
    command: () => router.push('/faq')
  }
]

// Attach your webmention link tags using @vueuse/head
useHead({
  link: [
    {
      rel: 'webmention',
      href: 'https://webmention.io/jws.pictures/webmention'
    },
    {
      rel: 'pingback',
      href: 'https://webmention.io/jws.pictures/xmlrpc'
    }
  ]
})
</script>

<style>
/* Basic page layout */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Center header content */
header {
  text-align: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

/* Adjust the logo size and remove heading margins */
.logo-container img {
  height: 120px;
  margin-right: 0;
}

/* Menubar spans the full width */
.menubar {
  margin: 0;
  width: 100%;
}

/* Footer pinned to bottom if page is short */
footer {
  text-align: center;
  margin-top: auto;
  padding: 20px 0;
}
</style>