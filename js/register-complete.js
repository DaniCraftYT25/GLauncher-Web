document.addEventListener('DOMContentLoaded', function () {
    const BACKEND_URL = 'https://glauncher-api.onrender.com';
    const NOTIFICATION_DURATION = 2000; // 2 segundos para las notificaciones

    // Verificar si el token viene en la URL (desde la redirección del backend)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        localStorage.setItem('social_login_token', tokenFromUrl);
        // Limpiar la URL para que no se vea el token feo
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const tempToken = localStorage.getItem('social_login_token');

    // Si no hay token, el usuario no debería estar aquí. Redirigir.
    if (!tempToken) {
        console.error('No social login token found. Redirecting to login.');
        window.location.href = 'login.html?error=session_expired';
        return;
    }

    const form = document.getElementById('complete-registration-form');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const profilePreview = document.getElementById('profile-preview');
    
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressSteps = Array.from(document.querySelectorAll('.progress-step'));
    const nextButtons = document.querySelectorAll('.next-step-btn');
    const prevButtons = document.querySelectorAll('.prev-step-btn');
    let currentStep = 0;

    function updateStepView() {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });
        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', index <= currentStep);
        });
    }

    function validateStep(stepIndex) {
        const step = steps[stepIndex];
        const inputs = step.querySelectorAll('input[required]');
        for (const input of inputs) {
            if (!input.value && input.type !== 'checkbox') {
                window.showNotification(`Por favor, completa el campo "${input.labels[0].innerText}".`, 'warning');
                return false;
            }
            if (input.type === 'checkbox' && !input.checked) {
                window.showNotification('Debes aceptar los Términos y Condiciones para continuar.', 'warning');
                return false;
            }
        }
        return true;
    }

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                updateStepView();
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentStep--;
            updateStepView();
        });
    });

    profilePictureInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';

        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('security_code', document.getElementById('security-code').value); // Ajuste clave: enviar el código de seguridad del nuevo campo.

        if (profilePictureInput.files[0]) {
            formData.append('profile_picture', profilePictureInput.files[0]);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/complete_registration`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tempToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocurrió un error al completar el registro.');
            }

            // Limpiar el token temporal y guardar el token permanente
            localStorage.removeItem('social_login_token');
            localStorage.setItem('glauncher_token', data.token);

            window.showNotification(data.message, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, NOTIFICATION_DURATION);

        } catch (error) {
            window.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-rocket"></i> Finalizar Registro';
        }
    });

    updateStepView(); // Mostrar el primer paso al cargar la página
});