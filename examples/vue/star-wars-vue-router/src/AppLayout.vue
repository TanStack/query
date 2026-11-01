<template>
  <div>
    <nav
      class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12"
    >
      <RouterLink to="/">
        <span class="uppercase hover:underline">Home</span>
      </RouterLink>
      <RouterLink to="/films">
        <span class="uppercase hover:underline">Films</span>
      </RouterLink>
      <RouterLink to="/characters">
        <span class="uppercase hover:underline">Characters</span>
      </RouterLink>
    </nav>
    <div class="p-2">
      <RouterView />
    </div>
  </div>
</template>
