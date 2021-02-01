import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';

const Signup = () => {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState('');

  const { handleSubmit, register, watch, errors } = useForm();

  const reRef = useRef();

  const onSubmit = handleSubmit(async (formData) => {
    if (errorMessage) setErrorMessage('');

    const googleToken = await reRef.current.executeAsync();
    reRef.current.reset();

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          googleToken,
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        throw new Error(await res.text());
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  });

  return (
    <Layout>
      <h1>Sign Up</h1>

      <form onSubmit={onSubmit} className={utilStyles.form}>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="e.g. john@example.com"
            ref={register({ required: 'Email is required' })}
          />
          {errors.email && (
            <span role="alert" className={utilStyles.error}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="e.g. John-1234"
            ref={register({
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'must be 8 chars',
              },
              validate: (value) => {
                return (
                  [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].every((pattern) =>
                    pattern.test(value)
                  ) || 'must include lower, upper, number, and special chars'
                );
              },
            })}
          />
          {errors.password && (
            <span role="alert" className={utilStyles.error}>
              {errors.password.message}
            </span>
          )}
        </div>

        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            name="password2"
            placeholder="e.g. John-1234"
            ref={register({
              validate: (value) =>
                value === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.password2 && (
            <span role="alert" className={utilStyles.error}>
              {errors.password2.message}
            </span>
          )}
        </div>

        <div className={utilStyles.submit}>
          <button type="submit">Sign up</button>
        </div>
      </form>

      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        size="invisible"
        ref={reRef}
      />

      {errorMessage && (
        <p role="alert" className={utilStyles.errorMessage}>
          {errorMessage}
        </p>
      )}
    </Layout>
  );
};

export default Signup;
