import { nextTick } from 'vue'

export function useScrollToHash() {
  const scrollToHash = (hash) => {
    if (hash) {
      nextTick(() => {
        const el = document.querySelector(hash)
        if (el) {
          const parentLi = el.closest('li')
          const elToScroll = parentLi || el

          // Remove highlight from any previous refs
          document.querySelectorAll('.highlight-ref').forEach((highlight) => {
            highlight.classList.remove('highlight-ref')
          })

          // Add highlight to the current one
          elToScroll.classList.add('highlight-ref')

          // Smooth scroll
          elToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Optional: Remove highlight after 3 seconds
          setTimeout(() => {
            elToScroll.classList.remove('highlight-ref')
          }, 5000)
        }
      })
    }
  }

  return { scrollToHash }
}
