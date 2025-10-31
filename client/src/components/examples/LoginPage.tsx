import LoginPage from '../../pages/LoginPage';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

const { hook } = memoryLocation({ path: '/login' });

export default function LoginPageExample() {
  return (
    <Router hook={hook}>
      <LoginPage />
    </Router>
  );
}
