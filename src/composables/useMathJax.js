let mathJaxPromise

function loadMathJax() {
  if (globalThis.MathJax?.typesetPromise) {
    return Promise.resolve(globalThis.MathJax)
  }

  if (!mathJaxPromise) {
    globalThis.MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
      },
      startup: {
        typeset: false,
      },
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
    script.async = true
    script.id = 'mathjax-script'

    mathJaxPromise = new Promise((resolve, reject) => {
      script.onload = () => {
        const mathJax = globalThis.MathJax
        if (!mathJax?.typesetPromise) {
          reject(new Error('MathJax loaded without its typesetting API'))
          return
        }
        resolve(mathJax)
      }
      script.onerror = () => reject(new Error('Could not load MathJax'))
      document.head.append(script)
    })
  }

  return mathJaxPromise
}

export function clearMathJax(element) {
  globalThis.MathJax?.typesetClear?.([element])
}

export async function typesetMathJax(element) {
  if (!element.isConnected || !element.querySelector('.stem, .stemblock')) return

  const mathJax = await loadMathJax()
  await mathJax.startup.promise
  if (!element.isConnected) return
  await mathJax.typesetPromise([element])
}
