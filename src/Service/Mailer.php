<?php

namespace App\Service;

use App\Entity\User;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
/**
 * The mailer.
 *
 * This service sends emails to users.
 */
class Mailer
{
  /**
   * @var MailerInterface
   */
  private $mailer;

  /**
   * Constructor function.
   *
   * @param MailerInterface $mailer
   */
  public function __construct(MailerInterface $mailer) {
    $this->mailer = $mailer;
  }

  /**
   * Create an email.
   *
   * @param User $user
   * @param string $template
   * @param string $subject
   * @return TemplatedEmail
   */
  private function createEmail(User $user, string $template, string $subject): TemplatedEmail
  {
    return (new TemplatedEmail())
      ->from(new Address('turtleoxford@gmail.com', 'Turtle System Oxford'))
      ->to(new Address($user->getEmail(), $user->getFirstname().' '.$user->getSurname()))
      ->subject('Turtle System: '.$subject)
      ->htmlTemplate('email/'.$template.'.html.twig')
      ->context(['user' => $user]);
  }

  /**
   * Send a verification email to the given user.
   *
   * @param User $user
   */
  public function sendVerificationEmail(User $user)
  {
    // create the email
    $email = $this->createEmail($user, 'verify', 'Verify Account');

    // send the email
    $this->mailer->send($email);
  }

  /**
   * Email credentials to the given user.
   *
   * @param User $user
   */
  public function sendCredentialsEmail(User $user)
  {
    // create the email
    $email = $this->createEmail($user, 'credentials', 'Reset Password');

    // send the email
    $this->mailer->send($email);
  }
}
