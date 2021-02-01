import { query as q } from 'faunadb';
import { guestClient } from '../../utils/fauna-client';
import { setAuthCookie } from '../../utils/auth-cookies';

export default async function signup(req, res) {
  const { email, password, googleToken } = req.body;

  const human = await validateHuman(googleToken);
  if (!human) {
    res.status(400);
    res.json({ errors: ['Please, you are not fooling us, bot.'] });
    return;
  }

  if (!email || !password) {
    return res.status(400).send('Email and Password not provided');
  }

  try {
    const existingEmail = await guestClient.query(
      // Exists returns boolean, Casefold returns normalize string
      q.Exists(q.Match(q.Index('user_by_email'), q.Casefold(email)))
    );

    if (existingEmail) {
      return res.status(400).send(`Email ${email} already exists`);
    }

    const user = await guestClient.query(
      q.Create(q.Collection('User'), {
        credentials: { password },
        data: { email, password },
      })
    );

    if (!user.ref) {
      return res.status(404).send('user ref is missing');
    }

    const auth = await guestClient.query(
      q.Login(user.ref, {
        password,
      })
    );

    if (!auth.secret) {
      return res.status(404).send('auth secret is missing');
    }

    setAuthCookie(res, auth.secret);

    res.status(201).end();
  } catch (error) {
    console.error(error);
    res.status(error.requestResult.statusCode).send(error.message);
  }
}

async function validateHuman(googleToken) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const res = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${googleToken}`,
    {
      method: 'POST',
    }
  );

  const data = await res.json();
  return data.success;
}
