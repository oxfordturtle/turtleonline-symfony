<?php

namespace App\Controller;

use App\Entity\File;
use App\Form\ChangePasswordType;
use App\Form\FileCreateType;
use App\Form\UserDetailsType;
use App\Form\UserEmailSettingsType;
use App\Service\FileManager;
use App\Service\UserManager;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Controller for the account pages of the site.
 *
 * @Route("/account", name="account_")
 * @IsGranted("ROLE_VERIFIED")
 */
class AccountController extends AbstractController
{
  /**
   * Route for the account overview page.
   *
   * @Route("/", name="index")
   * @return Response
   */
  public function index(): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // render and return the page
    return $this->render('account/index.html.twig');
  }

  /**
   * Route for the account details page.
   *
   * @Route("/details", name="details")
   * @return Response
   */
  public function details(Request $request, UserManager $userManager): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // create and handle the user details form
    $userDetailsForm = $this->createForm(UserDetailsType::class, $this->getUser());
    $userDetailsForm->handleRequest($request);
    if ($userDetailsForm->isSubmitted() && $userDetailsForm->isValid()) {
      $userManager->saveUser($this->getUser());
      $this->addFlash('success', 'Your details have been updated.');
    }

    // render and return the page
    return $this->render('account/details.html.twig', [
      'userDetailsForm' => $userDetailsForm->createView()
    ]);
  }

  /**
   * Route for the email settings page.
   *
   * @Route("/email", name="email")
   * @return Response
   */
  public function email(Request $request, UserManager $userManager): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // create and handle the user email settings form
    $userEmailSettingsForm = $this->createForm(UserEmailSettingsType::class, $this->getUser());
    $userEmailSettingsForm->handleRequest($request);
    if ($userEmailSettingsForm->isSubmitted() && $userEmailSettingsForm->isValid()) {
      $userManager->saveUser($this->getUser());
      $this->addFlash('success', 'Your settings have been updated.');
    }

    // render and return the page
    return $this->render('account/email.html.twig', [
      'userEmailSettingsForm' => $userEmailSettingsForm->createView()
    ]);
  }

  /**
   * Route for the change password page.
   *
   * @Route("/password", name="password")
   * @return Response
   */
  public function password(Request $request, UserManager $userManager): Response
  {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // create and handle the change password form
    $changePasswordForm = $this->createForm(ChangePasswordType::class);
    $changePasswordForm->handleRequest($request);
    if ($changePasswordForm->isSubmitted() && $changePasswordForm->isValid()) {
      $userManager->setEncodedPassword($this->getUser(), $changePasswordForm->getData()->getNewPassword());
      $userManager->saveUser($this->getUser());
      $this->addFlash('success', 'Your password has been changed.');
    }

    // render and return the page
    return $this->render('account/password.html.twig', [
      'changePasswordForm' => $changePasswordForm->createView()
    ]);
  }

  /**
   * Route for deleting an account.
   *
   * @Route("/delete", name="delete")
   * @param Request $request
   * @param UserManager $userManager
   * @return Response
   */
  public function delete(
    Request $request,
    TokenStorageInterface $tokenStorage,
    UserManager $userManager
  ): Response {
    // redirect if the user is not verified
    if (!$this->getUser()->isVerified()) {
      return $this->redirectToRoute('account_verify');
    }

    // create an empty form for submitting
    $deleteUserForm = $this->createFormBuilder()->getForm();
    $deleteUserForm->handleRequest($request);
    if ($deleteUserForm->isSubmitted() && $deleteUserForm->isValid()) {
      $userManager->deleteUser($this->getUser());
      $tokenStorage->setToken(null);
      $this->addFlash('success', 'Your account has been deleted.');
      return $this->redirectToRoute('home');
    }

    // render and return the page
    return $this->render('account/delete.html.twig', [
      'deleteUserForm' => $deleteUserForm->createView()
    ]);
  }

  /**
   * Route for updating default system settings.
   *
   * @Route("/update-settings", name="update_settings", methods={"POST"})
   * @param Request $request
   * @param UserManager $userManager
   * @return Response
   */
  public function updateSettings(
    Request $request,
    UserManager $userManager
  ): JsonResponse {
    $settings = json_decode($request->getContent(), true);
    $this->getUser()->setSystemSettings($settings);
    $userManager->saveUser($this->getUser());
    return new JsonResponse(['success' => true]);
  }
}
