import "./help.css"

const Help = () => {
  return (
    <div className="help">
      <div className="help-container">
        <h1 className="help-title">GUARDORA</h1>
        <h2 className="help-subtitle">Help & Support</h2>

        <div className="help-content">
          <div className="help-section">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-item">
              <h4>How does the PPE detection work?</h4>
              <p>
                Our AI-powered system uses YOLOv8 technology to detect personal protective equipment in real-time
                through camera feeds.
              </p>
            </div>
            <div className="faq-item">
              <h4>What equipment can be detected?</h4>
              <p>Currently, we can detect helmets, safety vests safety equipment.</p>
            </div>
            <div className="faq-item">
              <h4>How accurate is the detection?</h4>
              <p>Our system maintains over 85% accuracy in detecting PPE compliance violations.</p>
            </div>
          </div>

          <div className="help-section">
            <h3>Contact Support</h3>
            <p>If you need additional assistance, please don't hesitate to reach out to our support team.</p>
            <div className="support-info">
              <p>
                <strong>Email:</strong> support@guardora.com
              </p>
              <p>
                <strong>Phone:</strong> +977-9846111111
              </p>
              <p>
                <strong>Hours:</strong> 9:00 AM - 6:00 PM (NPT)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help