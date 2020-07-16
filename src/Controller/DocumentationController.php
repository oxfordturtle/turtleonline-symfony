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
   * Route for the user guide page.
   *
   * @Route(
   *   "/guide/{tab}",
   *   name="guide",
   *   requirements={"tab"="getting-started|how-to-use-this-guide|overview|the-(language|file|edit|view|compile|tabs|run|options|examples)-menu"}
   * )
   * @return Response
   */
  public function guide(string $tab = 'getting-started'): Response
  {
    // render and return the page
    return $this->render('documentation/guide.html.twig', ['tab' => $tab]);
  }

  /**
   * Route for the languages help page.
   *
   * @Route("/help", name="help")
   * @return Response
   */
  public function help(): Response
  {
    // render and return the page
    return $this->render('documentation/help.html.twig');
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
   * Route for the machine documentation page.
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
   * Route for the languages documentation page.
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
   * Route for the CSAC documentation page.
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
