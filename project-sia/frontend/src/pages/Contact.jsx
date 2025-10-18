import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Get In Touch</h1>
        <p>Have questions? We'd love to hear from you. Send us a message!</p>
      </div>

      <div className="contact-container">
        {/* Contact Information Cards */}
        <div className="contact-info-section">
          <h2>Contact Information</h2>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email</h3>
              <p className="contact-detail">
                <a href="mailto:mejiaspareparts@gmail.com">mejiaspareparts@gmail.com</a>
              </p>
              <p className="contact-subtext">Send us an email anytime</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📱</div>
              <h3>Phone</h3>
              <p className="contact-detail">
                <a href="tel:+639123456789">+63 912 345 6789</a>
              </p>
              <p className="contact-subtext">Mon-Sat, 8:00 AM - 6:00 PM</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📘</div>
              <h3>Facebook</h3>
              <p className="contact-detail">
                <a href="https://facebook.com/mejiaspareparts" target="_blank" rel="noopener noreferrer">
                  @MejiaSpareparts
                </a>
              </p>
              <p className="contact-subtext">Follow us for updates</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📍</div>
              <h3>Location</h3>
              <p className="contact-detail">Manila, Philippines</p>
              <p className="contact-subtext">Visit our shop</p>
            </div>
          </div>
        </div>

        {/* Contact Form and Map */}
        <div className="contact-main-section">
          <div className="contact-form-wrapper">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+63 912 345 6789"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="product-inquiry">Product Inquiry</option>
                  <option value="order-status">Order Status</option>
                  <option value="technical-support">Technical Support</option>
                  <option value="bulk-order">Bulk Order</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Send Message ✉️
              </button>
            </form>
          </div>

          <div className="business-hours-section">
            <h2>Business Hours</h2>
            <div className="hours-card">
              <div className="hours-row">
                <span className="day">Monday - Friday</span>
                <span className="time">8:00 AM - 6:00 PM</span>
              </div>
              <div className="hours-row">
                <span className="day">Saturday</span>
                <span className="time">9:00 AM - 5:00 PM</span>
              </div>
              <div className="hours-row closed">
                <span className="day">Sunday</span>
                <span className="time">Closed</span>
              </div>
            </div>

            <div className="quick-links">
              <h3>Quick Links</h3>
              <a href="#" className="quick-link">📦 Track My Order</a>
              <a href="#" className="quick-link">❓ FAQ</a>
              <a href="#" className="quick-link">🔄 Return Policy</a>
              <a href="#" className="quick-link">🚚 Shipping Information</a>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>🚚 Do you offer delivery?</h4>
              <p>Yes, we offer delivery within Metro Manila and shipping nationwide. Delivery fees vary by location.</p>
            </div>
            <div className="faq-item">
              <h4>💰 What payment methods do you accept?</h4>
              <p>We accept cash, GCash, bank transfer, and cash on delivery (COD) for verified customers.</p>
            </div>
            <div className="faq-item">
              <h4>🔄 Can I return or exchange items?</h4>
              <p>Yes, we accept returns and exchanges within 7 days of purchase for unused items with original packaging.</p>
            </div>
            <div className="faq-item">
              <h4>📦 How long does shipping take?</h4>
              <p>Metro Manila deliveries take 1-2 days. Provincial deliveries take 3-7 days depending on location.</p>
            </div>
            <div className="faq-item">
              <h4>✅ Are your parts genuine?</h4>
              <p>Yes, all our parts are 100% genuine and sourced directly from authorized distributors.</p>
            </div>
            <div className="faq-item">
              <h4>📞 Can I place orders by phone?</h4>
              <p>Yes! Call us at +63 912 345 6789 during business hours to place orders or make inquiries.</p>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="social-section">
          <h2>Connect With Us</h2>
          <p>Follow us on social media for the latest updates, promotions, and motorcycle tips!</p>
          <div className="social-buttons">
            <a href="https://facebook.com/mejiaspareparts" target="_blank" rel="noopener noreferrer" className="social-btn facebook">
              <span className="social-icon">📘</span>
              <span>Facebook</span>
            </a>
            <a href="https://instagram.com/mejiaspareparts" target="_blank" rel="noopener noreferrer" className="social-btn instagram">
              <span className="social-icon">📷</span>
              <span>Instagram</span>
            </a>
            <a href="https://twitter.com/mejiaspareparts" target="_blank" rel="noopener noreferrer" className="social-btn twitter">
              <span className="social-icon">🐦</span>
              <span>Twitter</span>
            </a>
            <a href="mailto:mejiaspareparts@gmail.com" className="social-btn email">
              <span className="social-icon">✉️</span>
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
