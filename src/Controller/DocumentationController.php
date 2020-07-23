<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller for the documentation pages of the site.
 *
 * @Route("/documentation", name="documentation_")
 */
class DocumentationController extends AbstractController
{
  /**
   * Route for the turtle system user guide page.
   *
   * @Route("/system", name="system")
   * @return Response
   */
  public function system(): Response
  {
    // render and return the page
    return $this->render('documentation/system.html.twig');
  }

  /**
   * Route for the turtle language guides page.
   *
   * @Route("/help/{tab}", name="help", requirements={"tab"="basics|structures|operators|input"})
   * @return Response
   */
  public function help(string $tab = 'basics'): Response
  {
    // render and return the page
    return $this->render('documentation/help.html.twig', ['tab' => $tab]);
  }

  /**
   * Route for the commands and constants reference page.
   *
   * @Route("/reference/{tab}", name="reference", requirements={"tab"="commands|colours|cursors|fonts|keycodes"})
   * @return Response
   */
  public function reference(string $tab = 'commands'): Response
  {
    // render and return the page
    return $this->render('documentation/reference.html.twig', ['tab' => $tab]);
  }

  /**
   * Route for the self-teach exercises page.
   *
   * @Route("/exercises", name="exercises")
   * @return Response
   */
  public function exercises(): Response
  {
    // render and return the page
    return $this->render('documentation/exercises.html.twig');
  }

  /**
   * Route for the machine specification page.
   *
   * @Route("/machine", name="machine")
   * @return Response
   */
  public function machine(): Response
  {
    // render and return the page
    return $this->render('documentation/machine.html.twig');
  }

  /**
   * Route for the languages specifications page.
   *
   * @Route("/languages", name="languages")
   * @return Response
   */
  public function languages(): Response
  {
    // render and return the page
    return $this->render('documentation/languages.html.twig');
  }

  /**
   * Route for the CSAC page.
   *
   * @Route("/csac", name="csac")
   * @return Response
   */
  public function csac(): Response
  {
    // render and return the page
    return $this->render('documentation/csac.html.twig');
  }

  /**
   * Route for the further reading page.
   *
   * @Route("/reading", name="reading")
   * @return Response
   */
  public function reading(): Response
  {
    // render and return the page
    return $this->render('documentation/reading.html.twig');
  }
}
