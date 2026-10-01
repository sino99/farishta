// app.js - Adapted: Enabled ScrollSmoother on touch devices with reduced smoothness for better mobile performance. Adjusted scroll triggers for stacked mobiGSAP scroll / parallax logic (adapted for mobile stacking and touch) ===
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

if (ScrollTrigger.isTouch !== 1) {
	// Desktop: full smoothness
	ScrollSmoother.create({
		wrapper: '.wrapper',
		content: '.content',
		smooth: 1.5,
		effects: true
	});
} else {
	// Mobile/touch: lighter smoothness to avoid jank, still enable for parallax
	ScrollSmoother.create({
		wrapper: '.wrapper',
		content: '.content',
		smooth: 0.8, // Reduced for better touch performance
		effects: true
	});
}

gsap.fromTo('.hero-section', { opacity: 1 }, {
	opacity: 0,
	scrollTrigger: {
		trigger: '.hero-section',
		start: 'center',
		end: '820',
		scrub: true
	}
});

let itemsL = gsap.utils.toArray('.gallery__left .gallery__item');

itemsL.forEach(item => {
	if (item.classList.contains('text-block')) {
		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: item,
				start: '-850',
				end: 'bottom center',
				scrub: true
			}
		});
		tl.fromTo(item, { opacity: 0, x: -50 }, {opacity: 1, x: 0, duration: 0.3})
		  .to(item, {opacity: 0, x: 0, duration: 0.7});
	} else {
		gsap.fromTo(item, { opacity: 0, x: -50 }, {
			opacity: 1, x: 0,
			scrollTrigger: {
				trigger: item,
				start: '-850',
				end: '-100',
				scrub: true
			}
		})
	}
});

let itemsR = gsap.utils.toArray('.gallery__right .gallery__item');

itemsR.forEach(item => {
	if (item.classList.contains('text-block')) {
		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: item,
				start: '-750',
				end: 'bottom center',
				scrub: true
			}
		});
		tl.fromTo(item, { opacity: 0, x: 50 }, {opacity: 1, x: 0, duration: 0.3})
		  .to(item, {opacity: 0, x: 0, duration: 0.7});
	} else {
		gsap.fromTo(item, { opacity: 0, x: 50 }, {
			opacity: 1, x: 0,
			scrollTrigger: {
				trigger: item,
				start: '-750',
				end: 'top',
				scrub: true
			}
		})
	}
});

// Mobile-specific: Adjust trigger starts/ends for stacked layout (shorter vertical distances)
if (window.innerWidth <= 768) {
	// Re-apply with adjusted values for vertical stack
	itemsL.forEach(item => {
		const st = ScrollTrigger.getById(item.id || 'left-item');
		if (st) st.kill();
		if (item.classList.contains('text-block')) {
			gsap.timeline({
				scrollTrigger: {
					trigger: item,
					start: '-400', // Shorter for mobile
					end: 'bottom center',
					scrub: true
				}
			}).fromTo(item, { opacity: 0, y: -20 }, {opacity: 1, y: 0, duration: 0.3})
			  .to(item, {opacity: 0, y: 20, duration: 0.7});
		} else {
			gsap.fromTo(item, { opacity: 0, y: -20 }, {
				opacity: 1, y: 0,
				scrollTrigger: {
					trigger: item,
					start: '-400',
					end: '-50',
					scrub: true
				}
			});
		}
	});

	itemsR.forEach(item => {
		const st = ScrollTrigger.getById(item.id || 'right-item');
		if (st) st.kill();
		if (item.classList.contains('text-block')) {
			gsap.timeline({
				scrollTrigger: {
					trigger: item,
					start: '-350', // Shorter for mobile
					end: 'bottom center',
					scrub: true
				}
			}).fromTo(item, { opacity: 0, y: 20 }, {opacity: 1, y: 0, duration: 0.3})
			  .to(item, {opacity: 0, y: -20, duration: 0.7});
		} else {
			gsap.fromTo(item, { opacity: 0, y: 20 }, {
				opacity: 1, y: 0,
				scrollTrigger: {
					trigger: item,
					start: '-350',
					end: 'top',
					scrub: true
				}
			});
		}
	});
}

const lyrics = [
	"Fall",
	"Fall in",
	"Fall in love",
	"Fall in",
	"Everything is",
	"Fall in love again and again",
	"Fall in love again and again",
	"Fall in love again and again",
	"Fall in love again and again",
	"Fall in love again and again",
	"Fall in love again and again",
	"Fall in love again and a-"
];


const timestamps = [
	0.00, 3.00, 8.20, 14.03, 24.70, 27.00, 28.80, 30.50, 32.20, 33.90, 35.60, 37.90
];

// Плеер и элементы
const audio = document.getElementById('sino-audio');
const playBtn = document.querySelector('.lyric-play');
const lyricDisplays = document.querySelectorAll('.lyric-display');

// Создаём DOM-элементы строк в каждом .lyric-display
lyricDisplays.forEach(display => {
	lyrics.forEach((line, i) => {
		const el = document.createElement('div');
		el.className = 'lyric-line';
		el.textContent = line;
		el.dataset.index = i;
		display.appendChild(el);
	});
});

// Управление плей/пауза
if (playBtn) {
	playBtn.addEventListener('click', () => {
		if (audio.paused) {
			audio.play();
			playBtn.textContent = '❚❚';
		} else {
			audio.pause();
			playBtn.textContent = '►';
		}
	});
}

// состояние
let currentIndex = -1;
let lastShownAt = 0;

// Вспомогательная: вычислить индекс по текущему времени, строго по timestamps
function indexFromTime(t) {
	// если до первой метки — ничего не показываем
	if (t < timestamps[0]) return -1;
	for (let i = timestamps.length - 1; i >= 0; i--) {
		if (t >= timestamps[i]) return i;
	}
	return -1;
}

// Плавная анимация входа/выхода через GSAP
function showLyricAtIndex(idx) {
	lyricDisplays.forEach(display => {
		const lines = display.querySelectorAll('.lyric-line');
		lines.forEach((el, i) => {
			// если это та строка, которую нужно показать
			if (i === idx) {
				// убиваем предыдущие твины
				gsap.killTweensOf(el);
				// вход: blur -> 0, y: 18->0, scale .98->1, opacity 0->1
				gsap.fromTo(el,
					{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' },
					{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: "power3.out" }
				);
				// планируем скрыть строку перед следующей меткой (если есть)
				const nextT = (i + 1 < timestamps.length) ? timestamps[i + 1] : (audio.duration || (timestamps[i] + 1.2));
				const remaining = Math.max(nextT - audio.currentTime, 0.25);
				// fade out плавно перед следующей
				gsap.to(el, { opacity: 0, y: -12, scale: 0.995, filter: 'blur(2px)', delay: Math.max(remaining - 0.18, 0.18), duration: 0.45, ease: "power2.in" });
			} else {
				// обеспечить скрытие остальных
				gsap.to(el, { opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)', duration: 0.2, overwrite: true });
			}
		});
	});
	lastShownAt = Date.now();
}

// При обновлении времени проверяем индекс и показываем при изменении
audio.addEventListener('timeupdate', () => {
	const t = audio.currentTime;
	const idx = indexFromTime(t);
	if (idx !== currentIndex) {
		currentIndex = idx;
		if (idx >= 0) showLyricAtIndex(idx);
		else {
			// если индекс -1, скрываем всё
			lyricDisplays.forEach(display => {
				gsap.to(display.querySelectorAll('.lyric-line'), { opacity: 0, y: 18, duration: 0.25 });
			});
		}
	}
});

// Когда трек заканчивается — сбрасываем кнопку и скрываем строки
audio.addEventListener('ended', () => {
	currentIndex = -1;
	playBtn && (playBtn.textContent = '►');
	lyricDisplays.forEach(display => {
		gsap.to(display.querySelectorAll('.lyric-line'), { opacity: 0, y: 18, duration: 0.25, stagger: 0.01 });
	});
});

// Также кликом по области показываем/пауза (удобство)
lyricDisplays.forEach(d => {
	d.addEventListener('click', () => {
		if (audio.paused) {
			audio.play();
			playBtn && (playBtn.textContent = '❚❚');
		} else {
			audio.pause();
			playBtn && (playBtn.textContent = '►');
		}
	});
});