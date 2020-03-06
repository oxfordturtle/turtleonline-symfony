<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller for Turtle System downloads.
 *
 * @Route("/turtle", name="turtle_")
 */
class TurtleController extends AbstractController
{
  /**
   * Route for downloading Turtle System version information.
   *
   * @Route("/versions", name="versions")
   * @return BinaryFileResponse
   */
  public function versions(): BinaryFileResponse
  {
    // get the file path
    $path = $this->getParameter('turtle_directory').'versions.json';

    // check the file exists
    if (!file_exists($path)) {
      throw new NotFoundHttpException('File '.$path.' not found.');
    }

    // return the file
    return new BinaryFileResponse($path);
  }

  /**
   * Route for downloading Turtle System download totals.
   *
   * @Route("/downloads", name="count")
   * @return BinaryFileResponse
   */
  public function count(Request $request): BinaryFileResponse
  {
    // get the file path
    $path = $this->getParameter('turtle_directory').'downloads.json';

    // check the file exists
    if (!file_exists($path)) {
      throw new NotFoundHttpException('File '.$path.' not found.');
    }

    // return the file
    return new BinaryFileResponse($path);
  }

  /**
   * Route for downloading the Turtle System
   *
   * @Route("/download/{version}", name="download")
   * @param string $version
   * @return BinaryFileResponse
   */
  public function download(string $version): BinaryFileResponse
  {
    // get the file directory and name
    $turtleDir = $this->getParameter('turtle_directory');
    $versions = json_decode(file_get_contents($turtleDir.'versions.json'), true);
    $filename = 'TurtleSystem_'.$versions[$version].'.exe';

    // check the file exists
    if (!file_exists($turtleDir.$filename)) {
      throw new NotFoundHttpException('File '.$filename.' not found.');
    }

    // increment the download totals
    $count = json_decode(file_get_contents($turtleDir.'downloads.json'), true);
    $month = date('Y').'.'.date('m');
    if (!array_key_exists($month, $count)) {
      $count[$month] = [];
    }
    if (!array_key_exists('D'.$version, $count[$month])) {
      $count[$month]['D'.$version] = 1;
    } else {
      $count[$month]['D'.$version] += 1;
    }
    $data = json_encode($count, JSON_PRETTY_PRINT);
    file_put_contents($turtleDir.'downloads.json', $data);

    // create and return the response
    $response = new BinaryFileResponse($turtleDir.$filename);
    $response->setContentDisposition('attachment', 'TurtleSystem'.$version.'.exe');
    return $response;
  }
}
