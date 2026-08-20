const FOOTER_PHRASES = [
  'FEEL THE BURN',
  'TRAIN HARD',
  'TRACK EVERYTHING',
  'KEEP THE STREAK ALIVE',
  'NO EXCUSES',
]

function Footer() {
  // Render the phrase loop twice back-to-back so the marquee can scroll
  // from 0% to -50% and loop seamlessly with no visible gap or jump.
  const loopContent = [...FOOTER_PHRASES, ...FOOTER_PHRASES]

  return (
    <footer className="bg-charcoal border-t border-charcoal-light mt-auto py-4">
      <div className="footer-marquee">
        <div className="footer-marquee-track">
          {loopContent.map((phrase, index) => (
            <span
              key={index}
              className="font-display text-lg tracking-wide text-chalk mx-8"
            >
              {phrase}
              <span className="text-ember mx-8"></span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
