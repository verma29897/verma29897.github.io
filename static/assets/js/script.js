$(document).ready(function () {

    $('#menu').click(function () {
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        if (window.scrollY > 60) {
            document.querySelector('#scroll-top').classList.add('active');
        } else {
            document.querySelector('#scroll-top').classList.remove('active');
        }

        $('section').each(function () {
            let height = $(this).height();
            let offset = $(this).offset().top - 200;
            let top = $(window).scrollTop();
            let id = $(this).attr('id');

            if (top > offset && top < offset + height) {
                $('.navbar ul li a').removeClass('active');
                $('.navbar').find(`[href="#${id}"]`).addClass('active');
            }
        });
    });

    $('a[href*="#"]').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top,
        }, 500, 'linear');
    });

});

document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === "visible") {
        document.title = "Portfolio | KRISHNA KUMAR VERMA";
        $("#favicon").attr("href", "assets/images/favicon.png");
    } else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href", "assets/images/favhand.png");
    }
});

var typed = new Typed(".typing-text", {
    strings: ["Backend Development","Full Stack Developer"],
    loop: true,
    typeSpeed: 50,
    backSpeed: 25,
    backDelay: 500,
});

async function fetchData(type = "skills") {
    const urlMap = {
        skills: "/static/assets/skills.json",
        projects: "/static/assets/projects.json",
        experience: "/static/assets/experience.json"
    };

    const url = urlMap[type] || urlMap["skills"];
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// icon per skill category, falling back to a generic one for unknown categories
const CATEGORY_ICONS = {
    "Languages": "fas fa-code",
    "Backend Frameworks": "fas fa-layer-group",
    "Databases": "fas fa-database",
    "Cloud & Infrastructure": "fas fa-cloud",
    "Security & Networking": "fas fa-shield-alt",
    "Monitoring & DevOps": "fas fa-chart-line",
    "AI & Interfaces": "fas fa-brain"
};

function showSkills(skills) {
    const skillsContainer = document.getElementById("skillsContainer");

    // group by category, preserving the order they appear in skills.json
    const groups = new Map();
    skills.forEach(skill => {
        const category = skill.category || "Other";
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(skill);
    });

    let html = "";
    groups.forEach((items, category) => {
        const items_html = items.map(skill => `
            <div class="sk-item">
              <img src="${skill.icon}" alt="" loading="lazy" onerror="this.remove()" />
              <span>${skill.name}</span>
            </div>`).join("");

        html += `
        <div class="sk-group">
          <div class="sk-group-head">
            <i class="${CATEGORY_ICONS[category] || "fas fa-cube"}"></i>
            <h3>${category}</h3>
            <span class="sk-count">${items.length}</span>
          </div>
          <div class="sk-items">${items_html}</div>
        </div>`;
    });

    skillsContainer.innerHTML = html;
}

fetchData().then(data => {
    showSkills(data);
    // the groups are injected after ScrollReveal's initial pass, so reveal them here
    srtop.reveal('.skills .sk-group', { interval: 120 });
});

VanillaTilt.init(document.querySelectorAll(".tilt"), {
    max: 15,
});

const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("ct-status");

function setStatus(message, kind) {
    contactStatus.textContent = message;
    contactStatus.className = "ct-status" + (kind ? " is-" + kind : "");
}

contactForm.addEventListener("submit", async function (event) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phonePattern = /^[0-9]{10}$/;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    if (!emailPattern.test(email)) {
        event.preventDefault();
        setStatus("Please enter a valid email address.", "error");
        return;
    }
    if (!phonePattern.test(phone)) {
        event.preventDefault();
        setStatus("Please enter a valid 10-digit mobile number.", "error");
        return;
    }

    // post in the background so the visitor stays on the page
    event.preventDefault();
    const button = contactForm.querySelector(".ct-submit");
    button.disabled = true;
    setStatus("Sending…", null);

    try {
        const response = await fetch(contactForm.action, {
            method: "POST",
            body: new FormData(contactForm)
        });
        if (!response.ok) throw new Error(response.status);
        setStatus("Thanks — your message is on its way. I'll get back to you soon.", "ok");
        contactForm.reset();
    } catch (err) {
        setStatus("Something went wrong sending that. Email me directly at krishnakrverma97@gmail.com.", "error");
    } finally {
        button.disabled = false;
    }
});

document.onkeydown = function (e) {
    if (e.keyCode == 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) ||
                                     e.keyCode == 'C'.charCodeAt(0) ||
                                     e.keyCode == 'J'.charCodeAt(0))) ||
        (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
        return false;
    }
};

const srtop = ScrollReveal({
    origin: 'top',
    distance: '80px',
    duration: 1000,
    reset: true
});

srtop.reveal('.home .content h3', { delay: 200 });
srtop.reveal('.home .content p', { delay: 200 });
srtop.reveal('.home .content .hero-actions', { delay: 200 });
srtop.reveal('.home .image', { delay: 400 });
srtop.reveal('.home .linkedin', { interval: 600 });
srtop.reveal('.home .github', { interval: 800 });
srtop.reveal('.home .twitter', { interval: 1000 });
srtop.reveal('.home .telegram', { interval: 600 });
srtop.reveal('.home .instagram', { interval: 600 });
srtop.reveal('.home .dev', { interval: 600 });
srtop.reveal('.about .ab-portrait', { delay: 200 });
srtop.reveal('.about .ab-body', { delay: 200 });
srtop.reveal('.projects .proj-card', { interval: 120 });
srtop.reveal('.projects .proj-viewall', { delay: 200 });
srtop.reveal('.education .edu-card', { interval: 150 });
srtop.reveal('.education .edu-certs', { delay: 200 });
srtop.reveal('.experience .exp-item', { interval: 150 });
srtop.reveal('.contact .ct-side', { delay: 200 });
srtop.reveal('.contact .ct-form', { delay: 300 });
