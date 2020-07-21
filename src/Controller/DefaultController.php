<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller for the main pages of the site.
 *
 * @Route("/")
 */
class DefaultController extends AbstractController
{
  /**
   * Route for the home page.
   *
   * @Route("/", name="home")
   * @return Response
   */
  public function index(): Response
  {
    // render and return the page
    return $this->render('default/index.html.twig');
  }

  /**
   * Route for the online system page.
   *
   * @Route("/run", name="run")
   * @return Response
   */
  public function run(): Response
  {
    // render and return the page
    return $this->render('system/index.html.twig');
  }

  /**
   * Route for the documentation area (redirects to the first documentation page).
   *
   * @Route("/documentation", name="documentation")
   * @return Response
   */
  public function documentation(): Response
  {
    // redirect
    return $this->redirectToRoute('documentation_guide');
  }

  /**
   * Shortcut route for the CSAC page.
   *
   * @Route("/csac", name="csac")
   * @return Response
   */
  public function csac(): Response
  {
    // redirect
    return $this->redirectToRoute('documentation_csac');
  }

  /**
   * Route for the about page.
   *
   * @Route("/about", name="about")
   * @return Response
   */
  public function about(): Response
  {
    // render and return the page
    return $this->render('default/about.html.twig');
  }

  /**
   * Route for the contact page.
   *
   * @Route("/contact", name="contact")
   * @return Response
   */
  public function contact(): Response
  {
    // render and return the page
    return $this->render('default/contact.html.twig');
  }

  /**
   * Route for downloading a file from the downloads directory.
   *
   * @Route("/downloads/{path}", name="downloads", requirements={"path": ".+"})
   * @param string $path
   * @return BinaryFileResponse
   */
  public function downloads(string $path): BinaryFileResponse
  {
    // get the file path
    $path = $this->getParameter('downloads_directory').$path;

    // look for the file
    if (!file_exists($path)) {
      throw new NotFoundHttpException('File not found.');
    }

    // return the file
    return new BinaryFileResponse($path);
  }
}
