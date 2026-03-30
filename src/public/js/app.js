// Celebration confetti on task completion
document.body.addEventListener('taskCompleted', () => {
  createConfetti();
});

function createConfetti() {
  const colors = ['#f9d976', '#f4a0c0', '#a0d2f4', '#a8e6a3', '#e85d4a', '#d976f9'];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '-10px';
    particle.style.width = Math.random() * 8 + 4 + 'px';
    particle.style.height = Math.random() * 8 + 4 + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty('--fall-duration', Math.random() * 2 + 1.5 + 's');
    particle.style.setProperty('--rotation', Math.random() * 1080 + 'deg');
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(particle);

    // Clean up after animation
    setTimeout(() => particle.remove(), 4000);
  }
}

// HTMX event: re-run entrance animations on swapped content
document.body.addEventListener('htmx:afterSwap', (e) => {
  const cards = e.detail.target.querySelectorAll('.task-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = i * 0.05 + 's';
  });
});
