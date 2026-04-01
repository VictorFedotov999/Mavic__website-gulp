const questionsContainer = document.querySelector('.questions__items');

questionsContainer.addEventListener('click', (event) => {
    const item = event.target.closest('.questions__item');
    if (!item) return;

    const text = item.querySelector('.questions__item__info-text');
    const arrow = item.querySelector('.questions__item-btn-img');

    const allItems = document.querySelectorAll('.questions__item');

    allItems.forEach((el) => {
        if (el !== item) {
            el.querySelector('.questions__item__info-text').classList.remove('active');
            el.querySelector('.questions__item-btn-img').classList.remove('rotated');
        }
    });

    text.classList.toggle('active');
    arrow.classList.toggle('rotated');
});

$('.about__slider-img').slick({
    prevArrow:
        '<button type="button" class="slick-prev"><svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.21839 1L1 9L9.21839 17" stroke="white"/></svg></button>',
    nextArrow:
        '<button type="button" class="slick-next"><svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.78161 17L9 9L0.78161 1" stroke="white"/></svg></button>',
    infinite: false,
});

$('#fullpage').fullpage({
    autoScrolling: true,
    scrollHorizontally: true,
    sectionSelector: '.page--popup',
});
