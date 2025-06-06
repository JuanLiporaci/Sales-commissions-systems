import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, signInWithGoogle } from '../services/auth';
import { FcGoogle } from 'react-icons/fc';
import { BsEnvelope, BsLock, BsEye, BsEyeSlash, BsPerson } from 'react-icons/bs';
import { Form, Button, Card, InputGroup, Alert } from 'react-bootstrap';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      width: '100%',
      backgroundColor: '#f8f9fa'
    }}>
      <Card style={{ maxWidth: '450px', width: '100%' }} className="border-0 shadow mx-3">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 p-3 rounded-circle">
              <BsPerson className="fs-2 text-success" />
            </div>
            <h2 className="fw-bold">Crear cuenta</h2>
            <p className="text-muted">Completa tus datos para comenzar</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4 text-center">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsPerson />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nombre y apellido"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsEnvelope />
                </InputGroup.Text>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Tu email"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                />
                <Button 
                  variant="light" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="border-start-0"
                >
                  {showPassword ? <BsEyeSlash /> : <BsEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirmar contraseña</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsLock />
                </InputGroup.Text>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu contraseña"
                  required
                />
                <Button 
                  variant="light" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="border-start-0"
                >
                  {showConfirmPassword ? <BsEyeSlash /> : <BsEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check 
                type="checkbox" 
                id="terms" 
                label={
                  <span>
                    Acepto los <a href="#" className="text-decoration-none">términos y condiciones</a> y la <a href="#" className="text-decoration-none">política de privacidad</a>
                  </span>
                }
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="success"
              className="w-100 py-2"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </Form>

          <div className="text-center my-4 position-relative">
            <hr className="text-muted" />
            <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted">
              o registrarse con
            </span>
          </div>

          <div className="d-grid">
            <Button 
              variant="outline-secondary" 
              className="d-flex align-items-center justify-content-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <FcGoogle size={20} />
              <span>Google</span>
            </Button>
          </div>

          <div className="text-center mt-4">
            <p className="mb-0">
              ¿Ya tienes una cuenta?{" "}
              <a href="/login" className="text-success text-decoration-none fw-semibold">
                Iniciar sesión
              </a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Register; 