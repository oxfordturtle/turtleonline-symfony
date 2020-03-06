<?php

namespace App\Controller;

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
   * Route for the user overview page.
   *
   * @Route("/", name="index")
   * @param UserManager $userManager
   * @return Response
   */
  public function index(UserManager $userManager): Response
  {
    // initialise the twig variables
    $twigs = [
      'users' => $userManager->getUsers()
    ];

    // render and return the page
    return $this->render('admin/index.html.twig', $twigs);
  }
}
