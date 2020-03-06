<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;

/**
 * The user manager.
 *
 * This service handles the main business logic related to users.
 */
class UserManager
{
  /**
   * @var EntityManagerInterface
   */
  private $entityManager;

  /**
   * @var UserPasswordEncoderInterface
   */
  private $passwordEncoder;

  /**
   * Constructor function.
   *
   * @param EntityManagerInterface $entityManager
   * @param UserPasswordEncoderInterface $passwordEncoder
   */
  public function __construct(
    EntityManagerInterface $entityManager,
    UserPasswordEncoderInterface $passwordEncoder
  ) {
    $this->entityManager = $entityManager;
    $this->passwordEncoder = $passwordEncoder;
  }

  /**
   * Get all users.
   *
   * @return User[]
   */
  public function getUsers(): array
  {
    return $this->entityManager->getRepository(User::class)->findAll();
  }

  /**
   * Get a user by email.
   *
   * @param string $email
   * @return User|null
   */
   public function getUserByEmail(string $email): ?User
   {
     return $this->entityManager->getRepository(User::class)->findOneByEmail($email);
   }

  /**
   * Save/update a user.
   *
   * @param User $user
   */
  public function saveUser(User $user)
  {
    $this->entityManager->persist($user);
    $this->entityManager->flush();
  }

  /**
   * Create a new user.
   *
   * @return User
   */
  public function createUser(): User
  {
    $user = new User();
    $this->setRandomToken($user);
    return $user;
  }

  /**
   * Encode a user's password.
   *
   * @param User $user
   * @param string $password
   */
  public function setEncodedPassword(User $user, string $password)
  {
    $user->setPassword($this->passwordEncoder->encodePassword($user, $password));
  }

  /**
   * Set a random verification token for a user.
   *
   * @param User $user
   */
  public function setRandomToken(User $user)
  {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    $length = 20;
    $token = '';
    for ($i = 0; $i < $length; $i++) {
      $token .= $chars[rand(0, strlen($chars) - 1)];
    }
    $user->setToken($token);
    $user->setTokenDate(new \DateTime('now'));
  }

  /**
   * Delete a user.
   *
   * @param User $user
   */
  public function deleteUser(User $user)
  {
    // delete all the user's activity logs
    foreach ($user->getLogs()->toArray() as $log) {
      $this->entityManager->remove($log);
    }

    // TODO: delete all the user's files

    // delete the user
    $this->entityManager->remove($user);

    // flush the changes
    $this->entityManager->flush();
  }
}
