import RegisterPage from '../../pages/RegisterPage';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

const { hook } = memoryLocation({ path: '/register' });

export default function RegisterPageExample() {
  return (
    <Router hook={hook}>
      <RegisterPage />
    </Router>
  );
}
