import "./contact.css"

const Contact = () => {
  return (
    <div className="contact">
      <div className="contact-container">
        <h1 className="contact-brand">GUARDORA</h1>

        <div className="contact-title-container">
          <h2 className="contact-title">Contact Us</h2>
          <div className="title-underline"></div>
        </div>

        <div className="contact-info">
          <div className="contact-item">
            <div className="contact-icon">📍</div>
            <div className="contact-details">
              <span className="contact-text">Kathmandu, Nepal</span>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📞</div>
            <div className="contact-details">
              <span className="contact-text">9846111111</span>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">✉️</div>
            <div className="contact-details">
              <span className="contact-text">guardora@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact