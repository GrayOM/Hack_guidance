document.addEventListener("DOMContentLoaded", function() {
    const swiper = new Swiper('.swiper-container', {
        pagination: {
            el: '.swiper-pagination',
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        }
        // 다른 Swiper 옵션들
    });

    const canvas = document.getElementById('canv');
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    
    const cols = Math.floor(w / 20) + 1;
    const ypos = Array(cols).fill(0);
    
    function matrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // 반투명한 배경
        ctx.fillRect(0, 0, w, h);
    
        ctx.fillStyle = '#0f0';
        ctx.font = '15pt monospace';
    
        ypos.forEach((y, ind) => {
            const text = String.fromCharCode(Math.floor(Math.random() * 128));
            const x = ind * 20;
            ctx.fillText(text, x, y);
            if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
            else ypos[ind] = y + 20;
        });
    }
    
    setInterval(matrix, 50);
    
});
