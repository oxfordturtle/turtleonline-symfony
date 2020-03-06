<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Core\Exception\InvalidCsrfTokenException;
use Symfony\Component\Security\Core\Security;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Guard\Authenticator\AbstractFormLoginAuthenticator;
use Symfony\Component\Security\Http\Util\TargetPathTrait;

/**
 * Login form authenticator.
 */
class LoginFormAuthenticator extends AbstractFormLoginAuthenticator
{
  use TargetPathTrait;

  /**
   * EntityManagerInterface
   */
  private $entityManager;

  /**
   * Router
   */
  private $router;

  /**
   * CsrfTokenManagerInterface
   */
  private $csrfTokenManager;

  /**
   * UserPasswordEncoderInterface
   */
  private $passwordEncoder;

  /**
   * Constructor function.
   *
   * @param EntityManagerInterface $entityManager
   * @param Router $router
   * @param CsrfTokenManagerInterface $csrfTokenManager
   * @param UserPasswordEncoderInterface $passwordEncoder
   */
  public function __construct(
    EntityManagerInterface $entityManager,
    RouterInterface $router,
    CsrfTokenManagerInterface $csrfTokenManager,
    UserPasswordEncoderInterface $passwordEncoder,
    Security $security
  ) {
    $this->entityManager = $entityManager;
    $this->router = $router;
    $this->csrfTokenManager = $csrfTokenManager;
    $this->passwordEncoder = $passwordEncoder;
    $this->security = $security;
  }

  /**
   * Check whether the request supports login.
   *
   * @param Request $request
   * @return bool
   */
  public function supports(Request $request): bool
  {
    return ($request->attributes->get('_route') === 'login') && $request->isMethod('POST');
  }

  /**
   * Get the credentials from the login form.
   *
   * @param Request $request
   * @return array
   */
  public function getCredentials(Request $request)
  {
    // put the forms credentials in an array
    $credentials = [
      'username' => $request->request->get('_username'),
      'password' => $request->request->get('_password'),
      'csrf_token' => $request->request->get('_csrf_token'),
    ];

    // save the username to the session
    $request->getSession()->set(Security::LAST_USERNAME, $credentials['username']);

    // return the array
    return $credentials;
  }

  /**
   * Get the user from the credentials.
   *
   * @param array $credentials
   * @param UserProviderInterface $userProvider
   * @return UserInterface
   */
  public function getUser($credentials, UserProviderInterface $userProvider): User
  {
    // check the CSRF token
    $token = new CsrfToken('authenticate', $credentials['csrf_token']);
    if (!$this->csrfTokenManager->isTokenValid($token)) {
      throw new InvalidCsrfTokenException();
    }

    // look for the user
    $user = $this->entityManager->getRepository(User::class)->findOneBy(
      ['username' => $credentials['username']]
    );

    // throw an error if not found
    if (!$user) {
      throw new CustomUserMessageAuthenticationException('Username could not be found.');
    }

    // otherwise return the user
    return $user;
  }

  /**
   * Check the password.
   *
   * @param array $credentials
   * @param UserInterface $userInterface
   * @return bool
   */
  public function checkCredentials($credentials, UserInterface $user): bool
  {
    return $this->passwordEncoder->isPasswordValid($user, $credentials['password']);
  }

  /**
   * What to do if authentication is successful.
   *
   * @param Request $request
   * @param TokenInterface $token
   * @param mixed $providerKey
   */
  public function onAuthenticationSuccess(
    Request $request,
    TokenInterface $token,
    $providerKey
  ): RedirectResponse {
    // update last login details for this user in the database
    $user = $this->security->getUser();
    $user->setLastLoginDate(new \DateTime('now'));
    $this->entityManager->persist($user);

    // maybe redirect to secure referring page
    if ($targetPath = $this->getTargetPath($request->getSession(), $providerKey)) {
      return new RedirectResponse($targetPath);
    }

    // otherwise just redirect to the user account page
    return new RedirectResponse($this->router->generate('account_index'));
  }

  /**
   * Get the login URL.
   *
   * @return string
   */
  protected function getLoginUrl(): string
  {
    return $this->router->generate('login');
  }
}
