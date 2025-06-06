import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signInWithGoogle } from '../services/auth';
import { FcGoogle } from 'react-icons/fc';
import { BsEnvelope, BsLock, BsEye, BsEyeSlash } from 'react-icons/bs';
import { Container, Row, Col, Form, Button, Card, InputGroup, Alert } from 'react-bootstrap';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
            <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 p-3 rounded-circle">
              <BsLock className="fs-2 text-primary" />
            </div>
            <h2 className="fw-bold">Iniciar sesión</h2>
            <p className="text-muted">Accede a tu cuenta para continuar</p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4 text-center">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsEnvelope />
                </InputGroup.Text>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu email"
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label>Contraseña</Form.Label>
                <Button variant="link" className="p-0 text-decoration-none" size="sm">
                  ¿Olvidaste la contraseña?
                </Button>
              </div>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <BsLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 mt-3"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </Form>

          <div className="text-center my-4 position-relative">
            <hr className="text-muted" />
            <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted">
              o continuar con
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
              ¿No tienes una cuenta?{" "}
              <a href="/register" className="text-primary text-decoration-none fw-semibold">
                Regístrate
              </a>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login; 