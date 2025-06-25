// Navegação móvel
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Fechar menu móvel ao clicar em um link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Scroll suave e navegação ativa
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar evento de clique para todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Verificar se é um link interno (começa com #)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Calcular offset para compensar o header fixo
                    const headerHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Destacar seção ativa na navegação
    window.addEventListener('scroll', highlightActiveSection);
    
    // Inicializar sistema de documentação
    initDocumentation();
    
    // Inicializar animações
    initAnimations();
    
    // Inicializar efeitos especiais
    initSpecialEffects();
});

// Destacar seção ativa na navegação
function highlightActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Sistema de documentação com abas
function initDocumentation() {
    const docsTabs = document.querySelectorAll('.docs-tab');
    const docsPanels = document.querySelectorAll('.docs-panel');
    
    docsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remover classe active de todas as abas e painéis
            docsTabs.forEach(t => t.classList.remove('active'));
            docsPanels.forEach(p => p.classList.remove('active'));
            
            // Adicionar classe active à aba clicada e painel correspondente
            tab.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// Função para copiar código
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = 'var(--secondary)';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar código:', err);
    });
}

// Animações de entrada
function initAnimations() {
    // Simular AOS (Animate On Scroll)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);
    
    // Observar elementos com data-aos
    const animatedElements = document.querySelectorAll('[data-aos]');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
    
    // Animação de digitação no console
    animateConsole();
}

// Animação do console no hero
function animateConsole() {
    const consoleLines = document.querySelectorAll('.console-line');
    
    consoleLines.forEach((line, index) => {
        setTimeout(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, (index + 1) * 1000);
    });
}

// Efeitos especiais
function initSpecialEffects() {
    // Efeito parallax sutil no hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-particles');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
    
    // Efeito de hover nos cards
    const cards = document.querySelectorAll('.feature-card, .screenshot-item, .download-option');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Efeito ripple nos botões
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Contador animado para estatísticas
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        
        // Apenas animar números
        if (!isNaN(target.replace(/[^0-9]/g, ''))) {
            const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
            counter.textContent = '0';
            
            const increment = numericTarget / 100;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= numericTarget) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + target.replace(/[0-9]/g, '');
                }
            }, 20);
        }
    });
}

// Inicializar contadores quando a seção de download estiver visível
const downloadSection = document.querySelector('.download');
if (downloadSection) {
    const downloadObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                downloadObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    downloadObserver.observe(downloadSection);
}

// Smooth scroll para navegação
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        const headerHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Adicionar loading state para links externos
document.addEventListener('DOMContentLoaded', function() {
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    
    externalLinks.forEach(link => {
        link.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Abrindo...';
            
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
});

// Navbar transparente/sólida baseada no scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 15, 35, 0.98)';
    } else {
        navbar.style.background = 'rgba(15, 15, 35, 0.95)';
    }
});

// Adicionar CSS para efeito ripple
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    /* Animações de entrada personalizadas */
    .feature-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .screenshot-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .download-option {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Efeito de glow nos elementos interativos */
    .btn-primary:hover {
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 0 30px rgba(99, 102, 241, 0.4);
    }
    
    .feature-card:hover {
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 0 20px rgba(99, 102, 241, 0.2);
    }
    
    /* Animação de loading para botões */
    .btn.loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    .btn.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Função para adicionar estado de loading aos botões
function addLoadingState(button) {
    button.classList.add('loading');
    setTimeout(() => {
        button.classList.remove('loading');
    }, 2000);
}

// Adicionar analytics (se necessário)
function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
}

// Rastrear cliques em botões importantes
document.addEventListener('DOMContentLoaded', function() {
    const trackableButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    trackableButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = this.textContent.trim();
            trackEvent('Button', 'click', text);
        });
    });
});

// Função para detectar dispositivo móvel
function isMobile() {
    return window.innerWidth <= 768;
}

// Ajustar comportamento baseado no dispositivo
window.addEventListener('resize', function() {
    if (!isMobile()) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// Preloader simples (opcional)
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Adicionar classe para indicar que a página foi carregada
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        document.body.classList.add('ready');
    }, 100);
});