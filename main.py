from flask import Flask, request, render_template, send_from_directory
import smtplib
from email.message import EmailMessage

app = Flask(__name__)


def send_verification_email(name,email,phone,message):
    from_email = "sonuverma29897@gmail.com"
    password = "jnfc guic onvy ylaf"  

    def setup_server():
        """Set up the SMTP server."""
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        return server

    server = setup_server()

    try:
        server.login(from_email, password)

        
        body = f"""Hi Krishna,

        Name: {name}
        Email: {email}
        Phone: {phone}
        Message: {message}
        """
        subject = f'Visit my Website {name}'

        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = "krishnakrverma97@gmail.com"

        server.send_message(msg)
        server.quit()

        return {"message": "Email sent successfully"}
    except Exception as e:
        server.quit()
        return {"error": f"Error sending email: {e}"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/resume')
def resume():
    return render_template('resume.html')

@app.route('/resume/download')
def resume_download():
    return send_from_directory(
        'static/assets/resume',
        'Krishna_Kumar_Verma_Resume.pdf',
        as_attachment=True,
        download_name='Krishna_Kumar_Verma_Resume.pdf',
    )

@app.route('/submit-form', methods=['POST'])
def submit_form():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        message = request.form['message']

        print(f"Name: {name}, Email: {email}, Phone: {phone}, Message: {message}")
        send_verification_email(name,email,phone,message)
        
        # Redirect or show a success message
        return 'Form submitted successfully!'

if __name__ == '__main__':
    app.run(debug=True)
