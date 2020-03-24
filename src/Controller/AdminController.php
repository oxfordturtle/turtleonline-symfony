<?php

namespace App\Controller;

use App\Entity\User;
use App\Model\BulkEmail;
use App\Form\BulkEmailType;
use App\Service\Mailer;
use App\Service\UserManager;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\IsGranted;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller for the admin area of the site.
 *
 * @Route("/admin", name="admin_")
 * @IsGranted("ROLE_ADMIN")
 */
class AdminController extends AbstractController
{
  /**
   * Route for the admin area home page.
   *
   * @Route("/", name="index")
   * @return Response
   */
  public function index(): Response
  {
    // render and return the page
    return $this->render('admin/index.html.twig');
  }

  /**
   * Route for the user overview page.
   *
   * @Route("/users", name="users")
   * @param UserManager $userManager
   * @return Response
   */
  public function users(UserManager $userManager): Response
  {
    // initialise the twig variables
    $twigs = [
      'users' => $userManager->getUsers()
    ];

    // render and return the page
    return $this->render('admin/users.html.twig', $twigs);
  }

  /**
   * Route for viewing individual user.
   *
   * @Route("/user/{user}", name="user")
   * @param User $user
   * @param UserManager $userManager
   * @return Response
   */
  public function user(User $user, UserManager $userManager): Response
  {
    // initialise the twig variables
    $twigs = [
      'user' => $user
    ];

    // render and return the page
    return $this->render('admin/user.html.twig', $twigs);
  }

  /**
   * Route for the email page.
   *
   * @Route("/email", name="email")
   * @param Mailer $mailer
   * @return Response
   */
  public function email(Request $request, Mailer $mailer): Response
  {
    // create and handle the email form
    $bulkEmail = new BulkEmail();
    $bulkEmailForm = $this->createForm(BulkEmailType::class, $bulkEmail);
    $bulkEmailForm->handleRequest($request);
    if ($bulkEmailForm->isSubmitted() && $bulkEmailForm->isValid()) {
      $mailer->sendBulkEmail($bulkEmail);
      $this->addFlash('success', 'Email has been sent to all users.');
    }

    // render and return the page
    return $this->render('admin/email.html.twig', [
      'bulkEmailForm' => $bulkEmailForm->createView()
    ]);
  }
}
