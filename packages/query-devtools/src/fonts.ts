export const loadFonts = () => {
  const link = document.createElement('link')
  link.href =
    'https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}
