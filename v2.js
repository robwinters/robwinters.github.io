// Greeting (same as index.html)
const h = new Date().getHours();
document.getElementById('bio-greeting').textContent =
    h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

// ------------------------------------------------------------
// Work cards
// - Video cards play on hover (or while on screen on touch devices)
// - Clicking a finished card opens it in the lightbox
// - Prev / next step through finished cards in project order
// ------------------------------------------------------------

const canHover = window.matchMedia('(hover: hover)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function play(video) {
    // play() returns a promise that rejects if the browser blocks it; ignore that
    video.play().catch(() => {});
}

function stop(video) {
    video.pause();
    video.currentTime = 0;
}

// Hover preview for video cards
document.querySelectorAll('.card--video').forEach(card => {
    const button = card.querySelector('.card-media');
    const video = card.querySelector('video');

    if (canHover) {
        button.addEventListener('mouseenter', () => play(video));
        button.addEventListener('mouseleave', () => stop(video));
        button.addEventListener('focus', () => play(video));
        button.addEventListener('blur', () => stop(video));
    } else if (!reduceMotion) {
        // Phones and tablets have no hover, so play while the card is on screen
        new IntersectionObserver(entries => {
            entries.forEach(e => (e.isIntersecting ? play(video) : stop(video)));
        }, { threshold: 0.6 }).observe(button);
    }
});

// Gallery items, in project order (the page lists cards column by column)
const items = [...document.querySelectorAll('.card--gallery')]
    .map(card => {
        const button = card.querySelector('.card-media');
        return {
            button,
            order: Number(button.dataset.order),
            type: button.dataset.type,
            src: button.dataset.src,
            srcset: button.dataset.srcset || '',
            poster: button.dataset.poster,
            alt: card.querySelector('img')?.alt || '',
            caption: card.querySelector('.card-caption').textContent,
            preview: card.querySelector('video'),
        };
    })
    .sort((a, b) => a.order - b.order);

const lightbox = document.querySelector('.lightbox');
const frame = lightbox.querySelector('.lightbox-frame');
const lightboxVideo = lightbox.querySelector('.lightbox-video');
const lightboxImage = lightbox.querySelector('.lightbox-image');
const lightboxCaption = lightbox.querySelector('.lightbox-caption');
const prevButton = lightbox.querySelector('.lightbox-nav--prev');
const nextButton = lightbox.querySelector('.lightbox-nav--next');
let current = 0;

// Only show prev / next when there is more than one item
prevButton.hidden = nextButton.hidden = items.length < 2;

function clearVideo() {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();
}

function show(index) {
    current = (index + items.length) % items.length;   // wrap around at both ends
    const item = items[current];
    lightboxCaption.textContent = item.caption;

    if (item.type === 'video') {
        lightboxImage.hidden = true;
        lightboxImage.removeAttribute('srcset');
        lightboxImage.removeAttribute('src');
        frame.hidden = false;
        lightboxVideo.src = item.src;
        lightboxVideo.poster = item.poster;
        play(lightboxVideo);
    } else {
        clearVideo();
        frame.hidden = true;
        // The browser picks the smallest listed size that stays sharp on this screen
        lightboxImage.sizes = '(max-width: 640px) calc(100vw - 32px), min(calc(100vw - 176px), 193vh)';
        lightboxImage.srcset = item.srcset;
        lightboxImage.src = item.src;
        lightboxImage.alt = item.alt;
        lightboxImage.hidden = false;
    }
}

items.forEach((item, i) => {
    item.button.addEventListener('click', () => {
        if (item.preview) stop(item.preview);
        show(i);
        lightbox.showModal();
    });
});

prevButton.addEventListener('click', () => show(current - 1));
nextButton.addEventListener('click', () => show(current + 1));
lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());

lightbox.addEventListener('keydown', e => {
    if (items.length < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
});

// Clicking the dark area around the content closes it
lightbox.addEventListener('click', e => {
    if (e.target === lightbox) lightbox.close();
});

// Runs for the close button, a backdrop click and the Esc key
lightbox.addEventListener('close', () => {
    clearVideo();
    lightboxImage.removeAttribute('srcset');
    lightboxImage.removeAttribute('src');
});
